"""Devis, urgences, litiges, avis et favoris : un enregistrement JSON par objet, droits par type et par rôle.

Les noms de champs sont ceux du site (aucune traduction). Le serveur impose l'auteur, l'état initial et les champs réservés au personnel.
"""

import json
import random
from pathlib import Path
from threading import Lock
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

SCHEMA = Path(__file__).parents[3] / "db" / "007_records.sql"
SEED_REVIEWS = Path(__file__).with_name("seed_reviews.json")
KINDS = ("quote", "incident", "case", "review", "fav")
MAX_BYTES = 20_000
REF = r"^IB-[A-Z]{3}-\d{3}$"

QUOTE_FIELDS = ("code", "type", "from", "to", "date", "phone", "note", "pack", "milieu", "t")
INCIDENT_FIELDS = ("code", "ref", "type", "profil", "desc", "phone", "level", "t")
CASE_FIELDS = ("code", "kind", "objet", "ref", "review", "against", "againstName", "desc", "t", "replyDue", "hist")
PROVIDER_FIELDS = ("status", "amount", "delay", "rapport")


class Denied(Exception):
    pass


class Invalid(ValueError):
    pass


def _pick(d: dict[str, Any], keys: tuple[str, ...]) -> dict[str, Any]:
    return {k: d[k] for k in keys if k in d}


def _str(v: Any, n: int = 2000) -> str:
    if not isinstance(v, str) or len(v) > n:
        raise Invalid("texte invalide")
    return v


def check_size(d: dict[str, Any]) -> None:
    if len(json.dumps(d)) > MAX_BYTES:
        raise Invalid("enregistrement trop volumineux")


def is_staff(role: str) -> bool:
    return role in ("admin", "legal")


def owners(kind: str, d: dict[str, Any]) -> set[str]:
    """Personnes qui voient l'enregistrement en plus du personnel."""
    s = {d.get("by", "")}
    if kind == "case" and d.get("against"):
        s.add(d["against"])
    if kind in ("quote", "incident") and d.get("prestEmail"):
        s.add(d["prestEmail"])
    return {x for x in s if x}


def authorize(kind: str, role: str, me: str, name: str, old: dict[str, Any] | None, new: dict[str, Any]) -> dict[str, Any]:
    """Résultat d'un enregistrement ; lève Denied (interdit) ou Invalid (donnée incorrecte)."""
    check_size(new)
    if kind == "fav":
        refs = new.get("refs")
        if not isinstance(refs, list) or len(refs) > 200 or not all(isinstance(r, str) and len(r) <= 12 for r in refs):
            raise Invalid("favoris invalides")
        return {"refs": refs, "by": me}
    if kind == "review":
        if old is None:
            stars = new.get("stars")
            if not isinstance(stars, int) or not 1 <= stars <= 5:
                raise Invalid("note invalide")
            return {"ref": _str(new.get("ref"), 12), "who": name, "stars": stars, "text": _str(new.get("text", ""), 1000), "t": int(new.get("t", 0)), "by": me}
        if is_staff(role):  # modération
            return {**old, "removed": bool(new.get("removed", old.get("removed", False)))}
        raise Denied
    if kind in ("quote", "incident"):
        fields = QUOTE_FIELDS if kind == "quote" else INCIDENT_FIELDS
        if old is None:
            d = {**_pick(new, fields), "by": me, "status": "reçu", "prest": None if kind == "quote" else ""}
            if kind == "quote" and new.get("prestEmail"):  # le client a choisi un prestataire agréé
                d.update(prest=new.get("prest"), prestEmail=_str(new["prestEmail"], 120), status="attribué")
            return d
        if is_staff(role):
            return {**new, "code": old["code"], "by": old["by"]}
        if role == "provider" and old.get("prestEmail") == me:
            out = {**old, **_pick(new, PROVIDER_FIELDS)}
            if new.get("prestEmail") is None and "prestEmail" in new:  # refus : le dossier retourne à l'administration
                out.update(prestEmail=None, prest=None)
            return out
        raise Denied
    # kind == "case"
    if old is None:
        d = _pick(new, CASE_FIELDS)
        d.update(by=me, byName=name, lvl=1, status="ouvert", reply=None, assignee=None, decision=None)
        d["hist"] = d.get("hist") if isinstance(d.get("hist"), list) and len(d["hist"]) <= 5 else []
        return d
    if is_staff(role):
        return {**new, "code": old["code"], "by": old["by"]}
    if me not in (old.get("by"), old.get("against")):
        raise Denied
    out = dict(old)
    if new.get("reply") and not old.get("reply") and me == old.get("against"):
        out["reply"] = new["reply"]
    if isinstance(new.get("hist"), list) and old["hist"] == new["hist"][: len(old["hist"])] and len(new["hist"]) <= len(old["hist"]) + 3:
        out["hist"] = new["hist"]
    if new.get("lvl") == 2 and old.get("lvl") == 1 and new.get("status") == "escaladé" and old.get("status") == "résolu":  # contestation
        out.update(lvl=2, status="escaladé", assignee=None, assigneeName=None, decision=new.get("decision"))
    return out


class RecordStore:
    def __init__(self, url: str | None) -> None:
        self._pg = url.replace("+psycopg", "") if url and url.startswith("postgresql") else None
        self._mem: dict[tuple[str, str], dict[str, Any]] = {}
        self._lock = Lock()
        if self._pg:
            with self._conn() as c:
                if not c.execute("SELECT to_regclass('records') AS t").fetchone()["t"]:
                    c.execute(SCHEMA.read_text(encoding="utf8"))
        if not self.all("review"):  # avis d'exemple du catalogue
            for r in json.loads(SEED_REVIEWS.read_text(encoding="utf8")):
                self.put("review", key_of("review", r, "demo", True), r)

    def _conn(self) -> psycopg.Connection:
        return psycopg.connect(self._pg, row_factory=dict_row)  # type: ignore[arg-type]

    def all(self, kind: str) -> list[dict[str, Any]]:
        if self._pg:
            with self._conn() as c:
                return [r["data"] for r in c.execute("SELECT data FROM records WHERE kind=%s ORDER BY updated_at DESC LIMIT 1000", (kind,)).fetchall()]
        return [d for (k, _), d in self._mem.items() if k == kind][-1000:]

    def get(self, kind: str, key: str) -> dict[str, Any] | None:
        if self._pg:
            with self._conn() as c:
                r = c.execute("SELECT data FROM records WHERE kind=%s AND key=%s", (kind, key)).fetchone()
            return r["data"] if r else None
        return self._mem.get((kind, key))

    def put(self, kind: str, key: str, d: dict[str, Any]) -> None:
        if self._pg:
            with self._conn() as c:
                c.execute(
                    "INSERT INTO records (kind, key, data) VALUES (%s,%s,%s) ON CONFLICT (kind, key) DO UPDATE SET data=EXCLUDED.data, updated_at=now()",
                    (kind, key, Jsonb(d)),
                )
        else:
            with self._lock:
                self._mem[(kind, key)] = d

    def free_code(self, kind: str, code: str) -> str:
        prefix = code.rsplit("-", 1)[0]
        while True:
            c = f"{prefix}-{random.randint(1000, 9999)}"
            if self.get(kind, c) is None:
                return c


def key_of(kind: str, d: dict[str, Any], me: str, staff: bool = False) -> str:
    if kind == "fav":
        return me
    if kind == "review":
        return f"{d.get('ref')}|{d.get('t')}|{d.get('by') if staff else me}"
    return str(d.get("code", ""))
