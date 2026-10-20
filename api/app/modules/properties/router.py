from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from app.core.config import get_settings

from .repository import SeedPropertyRepository
from .schemas import PropertyOut, Status
from .service import PropertyService

router = APIRouter(prefix="/api/v1/properties", tags=["properties"])


@lru_cache
def get_service() -> PropertyService:
    return PropertyService(SeedPropertyRepository())


Service = Annotated[PropertyService, Depends(get_service)]


@router.get("", response_model=list[PropertyOut])
def list_properties(
    svc: Service,
    quartier: Annotated[str | None, Query(max_length=40)] = None,
    type: Annotated[str | None, Query(max_length=40)] = None,
    status: Status | None = None,
    max_price: Annotated[int | None, Query(ge=0, le=10**11)] = None,
    limit: Annotated[int, Query(ge=1)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[PropertyOut]:
    limit = min(limit, get_settings().max_page_size)
    return svc.search(quartier=quartier, type_=type, status=status, max_price=max_price, limit=limit, offset=offset)


@router.get("/{ref}", response_model=PropertyOut)
def get_property(svc: Service, ref: Annotated[str, Path(pattern=r"^IB-[A-Z]{3}-\d{3}$")]) -> PropertyOut:
    p = svc.get(ref)
    if p is None:
        raise HTTPException(status_code=404, detail="Bien introuvable")
    return p
