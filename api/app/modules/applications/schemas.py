from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AppStatus(str, Enum):
    """Les trois statuts visibles : en cours d'analyse, dossier accepté, dossier rejeté."""

    en_analyse = "en_analyse"
    accepte = "accepte"
    rejete = "rejete"


class RejectReason(str, Enum):
    pieces = "Pièces manquantes ou illisibles"
    solvabilite = "Solvabilité insuffisante"
    attribue = "Bien déjà attribué"
    incoherence = "Informations incohérentes"
    autre = "Autre motif"


class ApplicationCreate(BaseModel):
    ref: str = Field(pattern=r"^IB-[A-Z]{3}-\d{3}$")
    name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=6, max_length=30)
    email: str = Field(max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    situation: str = Field(max_length=40)
    income: int = Field(ge=0, le=10**9)


class Decision(BaseModel):
    """Un rejet exige un motif ; un accord n'en prend pas."""

    status: AppStatus
    reason: RejectReason | None = None
    note: str | None = Field(default=None, max_length=500)


class HistoryItem(BaseModel):
    at: datetime
    action: str


class ApplicationOut(BaseModel):
    code: str
    ref: str
    name: str
    phone: str
    email: str
    situation: str
    income: int
    status: AppStatus
    reason: RejectReason | None = None
    note: str | None = None
    created: datetime
    decided: datetime | None = None
    history: list[HistoryItem]
