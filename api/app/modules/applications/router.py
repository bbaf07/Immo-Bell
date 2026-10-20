from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response

from app.core.config import get_settings
from app.core.security import require_staff
from app.modules.properties.router import get_service as get_property_service
from app.modules.properties.service import PropertyService

from .pg import PgApplicationService
from .sqlite import SqliteApplicationService
from .schemas import AppStatus, ApplicationCreate, ApplicationOut, Decision
from .service import ApplicationService, DecisionError

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])
Code = Annotated[str, Path(pattern=r"^RES-\d{4}-\d{4}$")]


@lru_cache
def get_apps() -> ApplicationService:
    url = get_settings().database_url
    if not url:
        return ApplicationService()
    return SqliteApplicationService(url) if url.startswith("sqlite") else PgApplicationService(url)


Apps = Annotated[ApplicationService, Depends(get_apps)]
Staff = Annotated[str, Depends(require_staff)]


@router.post("", response_model=ApplicationOut, status_code=201)
def create(body: ApplicationCreate, apps: Apps, props: Annotated[PropertyService, Depends(get_property_service)]) -> ApplicationOut:
    if props.get(body.ref) is None:
        raise HTTPException(status_code=404, detail="Bien introuvable")
    return apps.create(body)


@router.get("", response_model=list[ApplicationOut])
def list_applications(apps: Apps, _: Staff, status: AppStatus | None = None) -> list[ApplicationOut]:
    return apps.find(status)


@router.patch("/{code}/decision", response_model=ApplicationOut)
def decide(code: Code, body: Decision, apps: Apps, _: Staff) -> ApplicationOut:
    try:
        return apps.decide(code, body)
    except KeyError:
        raise HTTPException(status_code=404, detail="Dossier introuvable") from None
    except DecisionError as e:
        raise HTTPException(status_code=422, detail=str(e)) from None


def _zip(data: bytes, name: str) -> Response:
    return Response(data, media_type="application/zip", headers={"Content-Disposition": f'attachment; filename="{name}"', "Cache-Control": "no-store"})


@router.get("/export/all")
def export_all(apps: Apps, _: Staff, status: AppStatus | None = None) -> Response:
    items = apps.find(status)
    if not items:
        raise HTTPException(status_code=404, detail="Aucun dossier à exporter")
    return _zip(apps.export_zip(items, f"liste:{status.value if status else 'tous'}"), "dossiers.zip")


@router.get("/export/property/{ref}")
def export_property(ref: Annotated[str, Path(pattern=r"^IB-[A-Z]{3}-\d{3}$")], apps: Apps, _: Staff) -> Response:
    items = [a for a in apps.find() if a.ref == ref]
    if not items:
        raise HTTPException(status_code=404, detail="Aucun dossier pour ce bien")
    return _zip(apps.export_zip(items, f"bien:{ref}"), f"dossiers-{ref}.zip")


@router.get("/export/tenant")
def export_tenant(apps: Apps, _: Staff, email: Annotated[str, Query(max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]) -> Response:
    items = [a for a in apps.find() if a.email.lower() == email.lower()]
    if not items:
        raise HTTPException(status_code=404, detail="Aucun dossier pour ce locataire")
    return _zip(apps.export_zip(items, f"locataire:{len(items)}"), "dossiers-locataire.zip")


@router.get("/{code}/export")
def export_one(code: Code, apps: Apps, _: Staff) -> Response:
    a = apps.get(code)
    if a is None:
        raise HTTPException(status_code=404, detail="Dossier introuvable")
    return _zip(apps.export_zip([a], f"dossier:{code}"), f"dossier-{code}.zip")
