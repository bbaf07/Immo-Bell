"""Notifications et messages : stockage (PostgreSQL ou mémoire) et droits par rôle."""

from pathlib import Path
from threading import Lock
from typing import Any, Literal

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

SCHEMA = Path(__file__).parents[3] / "db" / "006_inbox.sql"
STAFF = ("admin", "legal", "provider")
Kind = Literal["notif", "msg"]


class Notif(BaseModel):
    email: str = Field(max_length=120)
    text: str = Field(min_length=1, max_length=1000)
    t: int
    read: bool = False
    go: dict[str, str | None] | None = None


class Msg(BaseModel):
    with_: str = Field(alias="with", max_length=120)
    from_: Literal["me", "immo"] = Field(alias="from")
    text: str = Field(min_length=1, max_length=2000)
    t: int
    unread: bool = False


class Denied(Exception):
    pass


def key_of(kind: Kind, o: Notif | Msg) -> str:
    return f"{o.email}|{o.t}|{o.text}" if isinstance(o, Notif) else f"{o.with_}|{o.from_}|{o.t}|{o.text}"


def owner_email(o: Notif | Msg) -> str:
    return o.email if isinstance(o, Notif) else o.with_


def authorize(role: str, me: str, old: Notif | Msg | None, new: Notif | Msg, target_is_staff: bool) -> Notif | Msg:
    """Résultat d'un enregistrement ; lève Denied si interdit. Un existant ne change que par son indicateur de lecture."""
    if old is not None:
        if owner_email(new) != me and role not in ("admin", "legal"):
            raise Denied
        return old.model_copy(update={"read": new.read}) if isinstance(old, Notif) else old.model_copy(update={"unread": new.unread})
    if isinstance(new, Notif):
        if not (new.email == me or role in STAFF or target_is_staff):
            raise Denied
        return new
    if role in ("admin", "legal"):
        return new
    if new.with_ != me or new.from_ != "me":
        raise Denied
    return new


class InboxStore:
    def __init__(self, url: str | None) -> None:
        self._pg = url.replace("+psycopg", "") if url and url.startswith("postgresql") else None
        self._mem: dict[tuple[str, str], tuple[str, dict[str, Any]]] = {}
        self._lock = Lock()
        if self._pg:
            with self._conn() as c:
                if not c.execute("SELECT to_regclass('inbox') AS t").fetchone()["t"]:
                    c.execute(SCHEMA.read_text(encoding="utf8"))

    def _conn(self) -> psycopg.Connection:
        return psycopg.connect(self._pg, row_factory=dict_row)  # type: ignore[arg-type]

    @staticmethod
    def _load(kind: Kind, d: dict[str, Any]) -> Notif | Msg:
        return Notif.model_validate(d) if kind == "notif" else Msg.model_validate(d)

    def list(self, kind: Kind, email: str | None) -> list[Notif | Msg]:
        """`email` None = tout (personnel)."""
        if self._pg:
            with self._conn() as c:
                rows = c.execute("SELECT data FROM inbox WHERE kind=%s AND (%s::text IS NULL OR email=%s) ORDER BY (data->>'t')::bigint DESC LIMIT 500", (kind, email, email)).fetchall()
            return [self._load(kind, r["data"]) for r in rows]
        items = [(e, d) for (k, _), (e, d) in self._mem.items() if k == kind and (email is None or e == email)]
        return sorted((self._load(kind, d) for _, d in items), key=lambda o: o.t, reverse=True)[:500]

    def get(self, kind: Kind, key: str) -> Notif | Msg | None:
        if self._pg:
            with self._conn() as c:
                r = c.execute("SELECT data FROM inbox WHERE kind=%s AND key=%s", (kind, key)).fetchone()
            return self._load(kind, r["data"]) if r else None
        m = self._mem.get((kind, key))
        return self._load(kind, m[1]) if m else None

    def put(self, kind: Kind, o: Notif | Msg) -> None:
        d = o.model_dump(by_alias=True)
        if self._pg:
            with self._conn() as c:
                c.execute(
                    "INSERT INTO inbox (kind, key, email, data) VALUES (%s,%s,%s,%s) ON CONFLICT (kind, key) DO UPDATE SET data=EXCLUDED.data, updated_at=now()",
                    (kind, key_of(kind, o), owner_email(o), Jsonb(d)),
                )
        else:
            with self._lock:
                self._mem[(kind, key_of(kind, o))] = (owner_email(o), d)
