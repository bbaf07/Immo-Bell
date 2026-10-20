"""Annonces : stockage (PostgreSQL ou mémoire) et règles d'accès par rôle.

Le serveur décide de la validation : un propriétaire ne peut jamais publier lui-même un bien.
"""

import json
from pathlib import Path
from threading import Lock
from typing import Literal

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

SCHEMA = Path(__file__).parents[3] / "db" / "004_listings.sql"
SEED = Path(__file__).with_name("seed.json")
MAJOR = ("title", "q", "surface", "rooms")  # modifier l'un de ces champs renvoie un bien validé en validation
OWNER_FIELDS = ("title", "type", "mode", "q", "price", "rooms", "surface", "eq", "desc", "cond", "pack", "status")
Validation = Literal["en attente", "validé", "refusé", "archivé"]


class Listing(BaseModel):
    ref: str = Field(pattern=r"^IB-[A-Z]{3}-\d{3}$")
    title: str = Field(min_length=2, max_length=120)
    type: str = Field(max_length=40)
    mode: str = Field(max_length=40)
    q: str = Field(max_length=40)
    price: int = Field(ge=0, le=10**11)
    rooms: int = Field(ge=0, le=200)
    surface: int = Field(ge=0, le=10**6)
    status: Literal["libre", "réservé", "occupé"] = "libre"
    validation: Validation = "en attente"
    owner: str = Field(max_length=120)
    views: int = Field(default=0, ge=0)
    h: int = 0
    eq: list[str] = Field(default_factory=list, max_length=40)
    desc: str = Field(default="", max_length=4000)
    cond: str = Field(default="", max_length=2000)
    created: int = 0
    pack: str | None = Field(default=None, max_length=40)


class Denied(Exception):
    pass


def merge(role: str, email: str, old: Listing | None, new: Listing) -> Listing:
    """Résultat d'un enregistrement par `email` (rôle `role`) ; lève Denied si interdit."""
    if role == "admin":
        return new
    if role == "legal":  # le pôle juridique fait passer un bien réservé / occupé, rien d'autre
        if old is None:
            raise Denied
        return old.model_copy(update={"status": new.status})
    if role != "owner":
        raise Denied
    if old is None:
        return new.model_copy(update={"owner": email, "validation": "en attente", "views": 0, "status": "libre"})
    if old.owner != email:
        raise Denied
    out = old.model_copy(update={k: getattr(new, k) for k in OWNER_FIELDS})
    if old.validation == "validé" and any(getattr(old, k) != getattr(out, k) for k in MAJOR):
        out.validation = "en attente"
    return out


def visible(role: str | None, email: str | None, items: list[Listing]) -> list[Listing]:
    if role in ("admin", "legal"):
        return items
    return [p for p in items if p.validation == "validé" or (email is not None and p.owner == email)]


class ListingStore:
    def __init__(self, url: str | None) -> None:
        self._pg = url.replace("+psycopg", "") if url and url.startswith("postgresql") else None
        self._mem: dict[str, Listing] = {}
        self._lock = Lock()
        seed = [Listing.model_validate(p) for p in json.loads(SEED.read_text(encoding="utf8"))]
        if self._pg:
            with self._conn() as c:
                if not c.execute("SELECT to_regclass('listings') AS t").fetchone()["t"]:
                    c.execute(SCHEMA.read_text(encoding="utf8"))
                c.execute("ALTER TABLE listings ADD COLUMN IF NOT EXISTS pos bigserial")  # ordre d'insertion = ordre du catalogue
                if not c.execute("SELECT 1 FROM listings LIMIT 1").fetchone():
                    for p in seed:
                        self._save(c, p)
        else:
            self._mem = {p.ref: p for p in seed}

    def _conn(self) -> psycopg.Connection:
        return psycopg.connect(self._pg, row_factory=dict_row)  # type: ignore[arg-type]

    @staticmethod
    def _save(c: psycopg.Connection, p: Listing) -> None:
        c.execute(
            "INSERT INTO listings (ref, owner, validation, data) VALUES (%s,%s,%s,%s) "
            "ON CONFLICT (ref) DO UPDATE SET owner=EXCLUDED.owner, validation=EXCLUDED.validation, data=EXCLUDED.data, updated_at=now()",
            (p.ref, p.owner, p.validation, Jsonb(p.model_dump())),
        )

    def all(self) -> list[Listing]:
        if self._pg:
            with self._conn() as c:
                return [Listing.model_validate(r["data"]) for r in c.execute("SELECT data FROM listings ORDER BY pos").fetchall()]
        return list(self._mem.values())

    def get(self, ref: str) -> Listing | None:
        if self._pg:
            with self._conn() as c:
                r = c.execute("SELECT data FROM listings WHERE ref = %s", (ref,)).fetchone()
            return Listing.model_validate(r["data"]) if r else None
        return self._mem.get(ref)

    def put(self, p: Listing) -> None:
        if self._pg:
            with self._conn() as c:
                self._save(c, p)
        else:
            with self._lock:
                self._mem[p.ref] = p
