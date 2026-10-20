from functools import lru_cache
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.modules.auth.router import current_user
from app.modules.auth.service import UserOut

from .service import Denied, Invalid, RecordStore, authorize, is_staff, key_of, owners

router = APIRouter(prefix="/api/v1/records", tags=["records"])
Kind = Literal["quote", "incident", "case", "review", "fav"]


@lru_cache
def get_store() -> RecordStore:
    return RecordStore(get_settings().database_url)


Store = Annotated[RecordStore, Depends(get_store)]
Me = Annotated[UserOut | None, Depends(current_user)]


class Batch(BaseModel):
    items: list[dict[str, Any]] = Field(max_length=50)


def _visible(kind: str, u: UserOut | None, d: dict[str, Any]) -> bool:
    if kind == "review":
        return True  # les avis sont publics
    if u is None:
        return False
    return is_staff(u.role) or u.email in owners(kind, d) or (kind == "fav" and d.get("by") == u.email)


@router.get("")
def read(kind: Annotated[Kind, Query()], store: Store, me: Me) -> list[dict[str, Any]]:
    return [d for d in store.all(kind) if _visible(kind, me, d)]


@router.put("")
def write(kind: Annotated[Kind, Query()], body: Batch, store: Store, me: Me) -> list[dict[str, Any]]:
    """Enregistre un lot ; chaque élément refusé est ignoré. Renvoie l'état serveur des éléments acceptés (le code peut avoir changé)."""
    if me is None:
        raise HTTPException(status_code=401, detail="Connexion requise")
    out: list[dict[str, Any]] = []
    for item in body.items:
        sent = key_of(kind, item, me.email, is_staff(me.role))
        try:
            key = key_of(kind, item, me.email, is_staff(me.role))
            old = store.get(kind, key)
            if old is not None and kind in ("quote", "incident", "case") and old.get("by") != me.email and not is_staff(me.role) and not (me.email in owners(kind, old)):
                key = store.free_code(kind, key)  # code déjà pris par un autre : on en attribue un libre
                item = {**item, "code": key}
                old = None
            res = authorize(kind, me.role, me.email, me.name, old, item)
        except (Denied, Invalid):
            continue
        store.put(kind, key, res)
        out.append({"from": sent, "data": res})
    return out
