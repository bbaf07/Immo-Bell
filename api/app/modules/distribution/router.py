from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.modules.properties.router import get_service
from app.modules.properties.service import PropertyService

from .service import Platform, PlatformNotAllowed, listing_text

router = APIRouter(prefix="/api/v1/properties", tags=["distribution"])


class Listing(BaseModel):
    platform: Platform
    text: str
    automatic_publishing: bool = False  # toujours faux : copier-coller depuis le compte du propriétaire


@router.get("/{ref}/distribution/{platform}", response_model=Listing)
def distribution(
    ref: Annotated[str, Path(pattern=r"^IB-[A-Z]{3}-\d{3}$")],
    platform: Platform,
    svc: Annotated[PropertyService, Depends(get_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Listing:
    p = svc.get(ref)
    if p is None:
        raise HTTPException(status_code=404, detail="Bien introuvable")
    try:
        return Listing(platform=platform, text=listing_text(p, platform, settings.site_url))
    except PlatformNotAllowed as e:
        raise HTTPException(status_code=422, detail=str(e)) from None
