import csv
import io
import re
import zipfile
from datetime import UTC, datetime
from threading import Lock

from .schemas import AppStatus, ApplicationCreate, ApplicationOut, Decision, HistoryItem


class DecisionError(ValueError):
    pass


def _now() -> datetime:
    return datetime.now(UTC)


class ApplicationService:
    """Dépôt en mémoire, à remplacer par PostgreSQL. Le journal d'audit n'enregistre que des codes, pas de données personnelles."""

    def __init__(self) -> None:
        self._items: dict[str, ApplicationOut] = {}
        self._audit: list[tuple[datetime, str]] = []
        self._lock = Lock()
        self._seq = 0

    def create(self, data: ApplicationCreate) -> ApplicationOut:
        with self._lock:
            self._seq += 1
            code = f"RES-{_now().year}-{self._seq:04d}"
            now = _now()
            item = ApplicationOut(
                code=code, status=AppStatus.en_analyse, created=now,
                history=[HistoryItem(at=now, action="Dossier déposé")], **data.model_dump(),
            )
            self._items[code] = item
            return item

    def find(self, status: AppStatus | None = None) -> list[ApplicationOut]:
        return [a for a in self._items.values() if status is None or a.status == status]

    def get(self, code: str) -> ApplicationOut | None:
        return self._items.get(code)

    def decide(self, code: str, d: Decision) -> ApplicationOut:
        with self._lock:
            a = self._items.get(code)
            if a is None:
                raise KeyError(code)
            if d.status == AppStatus.en_analyse:
                raise DecisionError("Un dossier ne revient pas en analyse")
            if d.status == AppStatus.rejete and d.reason is None:
                raise DecisionError("Le motif de rejet est obligatoire")
            if d.status == AppStatus.accepte and d.reason is not None:
                raise DecisionError("Un dossier accepté ne porte pas de motif de rejet")
            now = _now()
            a.status, a.decided = d.status, now
            a.reason, a.note = (d.reason, d.note) if d.status == AppStatus.rejete else (None, None)
            a.history.append(HistoryItem(at=now, action="Dossier accepté" if d.status == AppStatus.accepte else f"Dossier rejeté : {a.reason.value}"))
            return a

    def audit(self, action: str) -> None:
        self._audit.append((_now(), action))

    def audit_log(self) -> list[tuple[datetime, str]]:
        return list(self._audit)

    # -- export -----------------------------------------------------------------
    @staticmethod
    def _safe(s: str) -> str:
        return re.sub(r"[^A-Za-z0-9._-]+", "_", s)[:60] or "dossier"

    def export_zip(self, items: list[ApplicationOut], label: str) -> bytes:
        """ZIP : une liste CSV (UTF-8 avec BOM, séparateur « ; » pour Excel) et une fiche texte par dossier."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            out = io.StringIO()
            w = csv.writer(out, delimiter=";", lineterminator="\r\n")
            w.writerow(["Code", "Bien", "Demandeur", "Téléphone", "E-mail", "Situation", "Revenu mensuel", "Statut", "Motif de rejet", "Déposé le", "Décidé le"])
            for a in items:
                w.writerow([self._cell(v) for v in (a.code, a.ref, a.name, a.phone, a.email, a.situation, a.income, a.status.value, a.reason.value if a.reason else "", a.created.isoformat(), a.decided.isoformat() if a.decided else "")])
            z.writestr("liste.csv", "\ufeff" + out.getvalue())
            for a in items:
                lines = [f"Dossier {a.code}", f"Bien : {a.ref}", f"Demandeur : {a.name}", f"Contact : {a.phone} · {a.email}", f"Situation : {a.situation} · revenu {a.income} FCFA / mois", f"Statut : {a.status.value}"]
                if a.reason:
                    lines.append(f"Motif de rejet : {a.reason.value}")
                if a.note:
                    lines.append(f"Précision : {a.note}")
                lines += ["", "Historique"] + [f"- {h.at:%d/%m/%Y %H:%M} · {h.action}" for h in a.history]
                z.writestr(f"{self._safe(a.code)}/fiche.txt", "\r\n".join(lines))
        self.audit(f"export:{label}:{len(items)}")
        return buf.getvalue()

    @staticmethod
    def _cell(v: object) -> str:
        """Neutralise l'injection de formule dans Excel : une cellule ne commence pas par = + - @."""
        s = str(v)
        return "'" + s if s[:1] in ("=", "+", "-", "@") else s
