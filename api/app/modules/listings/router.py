from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path

from app.core.config import get_settings
from app.modules.auth.router import current_user
from app.modules.auth.service import UserOut

from .service import Denied, Listing, ListingStore, merge, visible

router = APIRouter(prefix="/api/v1/listings", tags=["listings"])


@lru_cache
def get_store() -> ListingStore:
    return ListingStore(get_settings().database_url)


Store = Annotated[ListingStore, Depends(get_store)]
Me = Annotated[UserOut | None, Depends(current_user)]


@router.get("", response_model=list[Listing])
def list_listings(store: Store, me: Me) -> list[Listing]:
    return visible(me.role if me else None, me.email if me else None, store.all())


@router.put("/{ref}", response_model=Listing)
def save(body: Listing, store: Store, me: Me, ref: Annotated[str, Path(pattern=r"^IB-[A-Z]{3}-\d{3}$")]) -> Listing:
    if me is None:
        raise HTTPException(status_code=401, detail="Connexion requise")
    if body.ref != ref:
        raise HTTPException(status_code=422, detail="Référence incohérente")
    try:
        out = merge(me.role, me.email, store.get(ref), body)
    except Denied:
        raise HTTPException(status_code=403, detail="Accès refusé") from None
    store.put(out)
    return out


@router.post("/{ref}/validation", response_model=Listing)
def validate(store: Store, me: Me, ref: Annotated[str, Path(pattern=r"^IB-[A-Z]{3}-\d{3}$")], decision: str) -> Listing:
    """Réservé à l'administrateur : validé, refusé ou archivé."""
    if me is None:
        raise HTTPException(status_code=401, detail="Connexion requise")
    if me.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")
    if decision not in ("validé", "refusé", "archivé"):
        raise HTTPException(status_code=422, detail="Décision invalide")
    p = store.get(ref)
    if p is None:
        raise HTTPException(status_code=404, detail="Bien introuvable")
    p.validation = decision  # type: ignore[assignment]
    store.put(p)
    return p
