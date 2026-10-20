"""Garde d'accès du personnel (administration, pôle juridique).

Accepte une session de compte « admin » ou « legal ». Un jeton partagé (IMMOBELL_STAFF_TOKEN) reste possible
pour les scripts ; sans jeton configuré, seule la session ouvre l'accès.
"""

import hmac
from typing import Annotated

from fastapi import Depends, Header, HTTPException

from app.modules.auth.router import current_user
from app.modules.auth.service import UserOut

from .config import Settings, get_settings


def require_staff(
    settings: Annotated[Settings, Depends(get_settings)],
    user: Annotated[UserOut | None, Depends(current_user)],
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    if user and user.role in ("admin", "legal"):
        return user.email
    token = settings.staff_token
    given = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if token and given and hmac.compare_digest(given.encode(), token.encode()):
        return "staff"
    raise HTTPException(status_code=403 if user else 401, detail="Accès réservé au personnel")
