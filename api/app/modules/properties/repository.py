import json
from pathlib import Path
from typing import Protocol

from .schemas import PropertyOut


class PropertyRepository(Protocol):
    def list(self) -> list[PropertyOut]: ...
    def get(self, ref: str) -> PropertyOut | None: ...


class SeedPropertyRepository:
    """Dépôt en mémoire alimenté par les données de démonstration.

    À remplacer par un dépôt PostgreSQL (SQLAlchemy) sans changer le service ni les routes.
    """

    def __init__(self, path: Path | None = None) -> None:
        raw = json.loads((path or Path(__file__).with_name("seed.json")).read_text(encoding="utf-8"))
        self._items = [PropertyOut.model_validate(p) for p in raw["properties"]]

    def list(self) -> list[PropertyOut]:
        return list(self._items)

    def get(self, ref: str) -> PropertyOut | None:
        return next((p for p in self._items if p.ref == ref), None)
