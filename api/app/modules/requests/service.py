"""Demandes de réservation : stockage (PostgreSQL ou mémoire) et droits par rôle.

Le client dépose et peut annuler ses demandes ; seuls le pôle juridique et l'administrateur les décident.
"""

from pathlib import Path
from threading import Lock
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import BaseModel, ConfigDict, Field

SCHEMA = Path(__file__).parents[3] / "db" / "005_requests.sql"
CLIENT_FIELDS = ("note", "checks", "garant", "grev")  # modifiables par le client tant que le dossier est en attente


class Request(BaseModel):
    model_config = ConfigDict(extra="allow")  # le site ajoute des champs (annulation, historique…) : on les conserve

    code: str = Field(pattern=r"^RES-\d{4}-\d{4}$")
    ref: str = Field(pattern=r"^IB-[A-Z]{3}-\d{3}$")
    name: str = Field(min_length=2, max_length=80)
    phone: str = Field(max_length=30)
    date: str = Field(max_length=10)
    note: str = Field(default="", max_length=1000)
    status: str = Field(max_length=20)
    by: str = Field(max_length=120)
    t: int = 0
    stage: int = Field(default=1, ge=0, le=5)


class Denied(Exception):
    pass


def merge(role: str, email: str, old: Request | None, new: Request) -> Request:
    if old is None:  # dépôt : le serveur impose le demandeur et l'état initial
        if role not in ("visitor", "owner"):
            raise Denied
        extra = {k: v for k, v in (new.model_extra or {}).items() if k in CLIENT_FIELDS or k in ("end", "situation", "rev")}
        base = new.model_dump(include={"code", "ref", "name", "phone", "date", "note", "t"})
        return Request(**base, **extra, status="en attente", by=email, stage=min(new.stage, 2))
    if role in ("admin", "legal"):
        return new.model_copy(update={"code": old.code, "by": old.by})
    if old.by != email:
        raise Denied
    patch: dict[str, Any] = {k: getattr(new, k, None) for k in CLIENT_FIELDS if old.status == "en attente" and k in new.model_dump()}
    if new.status == "annulée" and old.status in ("en attente", "validée") and old.stage < 5:
        patch.update(status="annulée", cancel=(new.model_extra or {}).get("cancel"))
    return old.model_copy(update={k: v for k, v in patch.items() if v is not None})


class RequestStore:
    def __init__(self, url: str | None) -> None:
        self._pg = url.replace("+psycopg", "") if url and url.startswith("postgresql") else None
        self._mem: dict[str, Request] = {}
        self._lock = Lock()
        if self._pg:
            with self._conn() as c:
                if not c.execute("SELECT to_regclass('requests') AS t").fetchone()["t"]:
                    c.execute(SCHEMA.read_text(encoding="utf8"))

    def _conn(self) -> psycopg.Connection:
        return psycopg.connect(self._pg, row_factory=dict_row)  # type: ignore[arg-type]

    def all(self) -> list[Request]:
        if self._pg:
            with self._conn() as c:
                return [Request.model_validate(r["data"]) for r in c.execute("SELECT data FROM requests ORDER BY code DESC").fetchall()]
        return sorted(self._mem.values(), key=lambda r: r.code, reverse=True)

    def get(self, code: str) -> Request | None:
        if self._pg:
            with self._conn() as c:
                r = c.execute("SELECT data FROM requests WHERE code = %s", (code,)).fetchone()
            return Request.model_validate(r["data"]) if r else None
        return self._mem.get(code)

    def free_code(self, code: str) -> str:
        import random
        while True:
            c = f"{code.rsplit('-', 1)[0]}-{random.randint(1000, 9999)}"
            if self.get(c) is None:
                return c

    def put(self, r: Request) -> None:
        if self._pg:
            with self._conn() as c:
                c.execute(
                    "INSERT INTO requests (code, by_email, ref, status, data) VALUES (%s,%s,%s,%s,%s) "
                    "ON CONFLICT (code) DO UPDATE SET status=EXCLUDED.status, data=EXCLUDED.data, updated_at=now()",
                    (r.code, r.by, r.ref, r.status, Jsonb(r.model_dump())),
                )
        else:
            with self._lock:
                self._mem[r.code] = r
