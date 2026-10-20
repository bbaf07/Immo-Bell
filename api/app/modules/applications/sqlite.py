"""Dépôt SQLite des dossiers (fichier local, aucune installation) : mêmes méthodes que ApplicationService.

Utilisé quand IMMOBELL_DATABASE_URL vaut « sqlite:///chemin.db ». Une connexion par appel : suffisant pour un site à faible trafic.
"""

import json
import sqlite3
from datetime import UTC, datetime

from .schemas import AppStatus, ApplicationCreate, ApplicationOut, Decision, HistoryItem
from .service import ApplicationService, DecisionError

SCHEMA = """
CREATE TABLE IF NOT EXISTS applications (
  code TEXT PRIMARY KEY, id INTEGER UNIQUE, property_ref TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
  email TEXT NOT NULL, situation TEXT NOT NULL, income INTEGER NOT NULL CHECK (income >= 0),
  status TEXT NOT NULL DEFAULT 'en_analyse' CHECK (status IN ('en_analyse', 'accepte', 'rejete')),
  reason TEXT, note TEXT, created_at TEXT NOT NULL, decided_at TEXT, history TEXT NOT NULL,
  CHECK ((status = 'rejete') = (reason IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS app_status ON applications (status, created_at);
"""


def _dt(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s) if s else None


class SqliteApplicationService(ApplicationService):
    def __init__(self, url: str) -> None:
        super().__init__()
        self._path = url.removeprefix("sqlite:///")
        with self._conn() as c:
            c.executescript(SCHEMA)

    def _conn(self) -> sqlite3.Connection:
        c = sqlite3.connect(self._path)
        c.row_factory = sqlite3.Row
        return c

    @staticmethod
    def _out(r: sqlite3.Row) -> ApplicationOut:
        return ApplicationOut(
            code=r["code"], ref=r["property_ref"], name=r["name"], phone=r["phone"], email=r["email"], situation=r["situation"],
            income=r["income"], status=r["status"], reason=r["reason"], note=r["note"], created=_dt(r["created_at"]), decided=_dt(r["decided_at"]),
            history=[HistoryItem(**h) for h in json.loads(r["history"])],
        )

    def create(self, data: ApplicationCreate) -> ApplicationOut:
        now = datetime.now(UTC)
        hist = json.dumps([HistoryItem(at=now, action="Dossier déposé").model_dump(mode="json")])
        with self._lock, self._conn() as c:
            n = c.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM applications").fetchone()[0]
            code = f"RES-{now.year}-{n:04d}"
            c.execute(
                "INSERT INTO applications (code, id, property_ref, name, phone, email, situation, income, created_at, history) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (code, n, data.ref, data.name, data.phone, data.email, data.situation, data.income, now.isoformat(), hist),
            )
        return self.get(code)  # type: ignore[return-value]

    def find(self, status: AppStatus | None = None) -> list[ApplicationOut]:
        with self._conn() as c:
            rows = c.execute("SELECT * FROM applications WHERE ? IS NULL OR status = ? ORDER BY id", (status and status.value,) * 2).fetchall()
        return [self._out(r) for r in rows]

    def get(self, code: str) -> ApplicationOut | None:
        with self._conn() as c:
            r = c.execute("SELECT * FROM applications WHERE code = ?", (code,)).fetchone()
        return self._out(r) if r else None

    def decide(self, code: str, d: Decision) -> ApplicationOut:
        if d.status == AppStatus.en_analyse:
            raise DecisionError("Un dossier ne revient pas en analyse")
        if d.status == AppStatus.rejete and d.reason is None:
            raise DecisionError("Le motif de rejet est obligatoire")
        if d.status == AppStatus.accepte and d.reason is not None:
            raise DecisionError("Un dossier accepté ne porte pas de motif de rejet")
        rej = d.status == AppStatus.rejete
        now = datetime.now(UTC)
        with self._lock, self._conn() as c:
            r = c.execute("SELECT history FROM applications WHERE code = ?", (code,)).fetchone()
            if r is None:
                raise KeyError(code)
            h = json.loads(r["history"]) + [HistoryItem(at=now, action=f"Dossier rejeté : {d.reason.value}" if rej and d.reason else "Dossier accepté").model_dump(mode="json")]
            c.execute(
                "UPDATE applications SET status=?, reason=?, note=?, decided_at=?, history=? WHERE code=?",
                (d.status.value, d.reason.value if rej and d.reason else None, d.note if rej else None, now.isoformat(), json.dumps(h), code),
            )
        return self.get(code)  # type: ignore[return-value]
