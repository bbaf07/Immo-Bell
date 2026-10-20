from enum import Enum

from pydantic import BaseModel, Field


class Status(str, Enum):
    libre = "libre"
    reserve = "réservé"
    occupe = "occupé"


class PropertyOut(BaseModel):
    """Champs exposés publiquement (liste blanche : pas de propriétaire, pas de données internes)."""

    ref: str = Field(pattern=r"^IB-[A-Z]{3}-\d{3}$")
    title: str
    type: str
    mode: str
    q: str
    price: int = Field(ge=0)
    rooms: int = Field(ge=0)
    surface: int = Field(ge=0)
    status: Status
    h: int
    eq: list[str]
    desc: str
    cond: str
