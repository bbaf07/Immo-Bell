"""Dépôt PostgreSQL des dossiers : mêmes méthodes que ApplicationService (IMMOBELL_DATABASE_URL = postgresql+psycopg://…)."""

from datetime import UTC, datetime
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .schemas import AppStatus, ApplicationCreate, ApplicationOut, Decision, HistoryItem
from .service import ApplicationService, DecisionError

SCHEMA = Path(__file__).parents[3] / "db" / "002_applications.sql"


class PgApplicationService(ApplicationService):
    def __init__(self, url: str) -> None:
        super().__init__()
        self._dsn = url.replace("+psycopg", "")
        with self._conn() as c:  # crée la table au premier démarrage
            if not c.execute("SELECT to_regclass('applications') AS t").fetchone()["t"]:
                c.execute(SCHEMA.read_text(encoding="utf8"))

    def _conn(self) -> psycopg.Connection:
        return psycopg.connect(self._dsn, row_factory=dict_row)

    @staticmethod
    def _out(r: dict) -> ApplicationOut:
        return ApplicationOut(
            code=r["code"], ref=r["property_ref"], name=r["name"], phone=r["phone"], email=r["email"], situation=r["situation"],
            income=r["income"], status=r["status"], reason=r["reason"], note=r["note"], created=r["created_at"], decided=r["decided_at"],
            history=[HistoryItem(**h) for h in r["history"]],
        )

    def create(self, data: ApplicationCreate) -> ApplicationOut:
        now = datetime.now(UTC)
        hist = [HistoryItem(at=now, action="Dossier déposé").model_dump(mode="json")]
        with self._conn() as c:
            r = c.execute(
                "INSERT INTO applications (code, property_ref, name, phone, email, situation, income, created_at, history) "
                "VALUES ('RES-' || extract(year from now())::int || '-' || lpad(nextval('application_seq')::text, 4, '0'), %s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                (data.ref, data.name, data.phone, data.email, data.situation, data.income, now, Jsonb(hist)),
            ).fetchone()
        return self._out(r)

    def find(self, status: AppStatus | None = None) -> list[ApplicationOut]:
        s = status.value if status else None
        with self._conn() as c:
            rows = c.execute("SELECT * FROM applications WHERE %s::text IS NULL OR status = %s ORDER BY created_at", (s, s)).fetchall()
        return [self._out(r) for r in rows]

    def get(self, code: str) -> ApplicationOut | None:
        with self._conn() as c:
            r = c.execute("SELECT * FROM applications WHERE code = %s", (code,)).fetchone()
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
        action = f"Dossier rejeté : {d.reason.value}" if rej and d.reason else "Dossier accepté"
        with self._conn() as c:
            r = c.execute(
                "UPDATE applications SET status=%s, reason=%s, note=%s, decided_at=%s, history = history || %s WHERE code=%s RETURNING *",
                (d.status.value, d.reason.value if rej and d.reason else None, d.note if rej else None, now, Jsonb([HistoryItem(at=now, action=action).model_dump(mode="json")]), code),
            ).fetchone()
        if r is None:
            raise KeyError(code)
        return self._out(r)
