from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path

from app.core.config import Settings, get_settings
from app.modules.auth.router import current_user
from app.modules.auth.service import UserOut
from app.modules.listings.router import get_store as get_listings
from app.modules.listings.service import ListingStore

from app.modules.messages.send import Mailer, Texter, notify

from .service import Denied, Request, RequestStore, merge

router = APIRouter(prefix="/api/v1/requests", tags=["requests"])


@lru_cache
def get_store() -> RequestStore:
    return RequestStore(get_settings().database_url)


Store = Annotated[RequestStore, Depends(get_store)]
Listings = Annotated[ListingStore, Depends(get_listings)]
Me = Annotated[UserOut | None, Depends(current_user)]


@router.get("", response_model=list[Request])
def list_requests(store: Store, me: Me, listings: Listings) -> list[Request]:
    if me is None:
        raise HTTPException(status_code=401, detail="Connexion requise")
    items = store.all()
    if me.role in ("admin", "legal"):
        return items
    mine = {p.ref for p in listings.all() if p.owner == me.email} if me.role == "owner" else set()
    return [r for r in items if r.by == me.email or r.ref in mine]  # le propriétaire voit les demandes sur ses biens


@router.put("/{code}", response_model=Request)
def save(code: Annotated[str, Path(pattern=r"^RES-\d{4}-\d{4}$")], body: Request, store: Store, me: Me, listings: Listings, mail: Mailer, sms: Texter, cfg: Annotated[Settings, Depends(get_settings)]) -> Request:
    if me is None:
        raise HTTPException(status_code=401, detail="Connexion requise")
    if body.code != code:
        raise HTTPException(status_code=422, detail="Code incohérent")
    old = store.get(code)
    if old is not None and old.by != me.email and me.role in ("visitor", "owner"):
        body, old = body.model_copy(update={"code": store.free_code(code)}), None  # code déjà pris par un autre : on en attribue un libre
    if old is None and listings.get(body.ref) is None:
        raise HTTPException(status_code=404, detail="Bien introuvable")
    try:
        out = merge(me.role, me.email, old, body)
    except Denied:
        raise HTTPException(status_code=403, detail="Accès refusé") from None
    store.put(out)
    p = listings.get(out.ref)
    v = {"code": out.code, "name": out.name.split()[0], "title": p.title if p else out.ref, "reason": (out.model_extra or {}).get("reason", "")}
    event = "request_received" if old is None else "request_accepted" if (old.status, out.status) == ("en attente", "validée") else "request_rejected" if (old.status, out.status) == ("en attente", "refusée") else None
    if event:
        notify(mail, sms, cfg.site_url, event, email=out.by, phone=out.phone, **v)
    return out
