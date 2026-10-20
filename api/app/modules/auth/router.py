from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response

from app.core.config import Settings, get_settings
from app.modules.messages.send import Mailer, notify

from .service import DUMMY_HASH, SESSION_SECONDS, Credentials, Forgot, Register, Reset, UserOut, UserStore, check_password, sign, verify

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
COOKIE = "ib_session"


@lru_cache
def get_users() -> UserStore:
    return UserStore(get_settings().database_url)


Users = Annotated[UserStore, Depends(get_users)]
Cfg = Annotated[Settings, Depends(get_settings)]


def secret(s: Settings) -> str:
    if s.session_secret:
        return s.session_secret
    if s.env == "dev":
        return "dev-only-secret-change-me"
    raise HTTPException(status_code=503, detail="Sessions non configurées")


def _set(resp: Response, user: UserOut, s: Settings) -> None:
    resp.set_cookie(COOKIE, sign(user.email, secret(s)), max_age=SESSION_SECONDS, httponly=True, samesite="lax", secure=s.env != "dev", path="/")


def current_user(users: Users, s: Cfg, ib_session: Annotated[str | None, Cookie()] = None) -> UserOut | None:
    email = verify(ib_session, secret(s)) if ib_session else None
    got = users.get(email) if email else None
    return got[0] if got else None


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: Register, resp: Response, users: Users, s: Cfg, mail: Mailer) -> UserOut:
    u = users.create(body.email, body.name.strip(), body.role, body.password)
    if u is None:
        raise HTTPException(status_code=409, detail="Un compte existe déjà avec cet e-mail")
    _set(resp, u, s)
    notify(mail, None, s.site_url, "welcome", email=u.email, name=u.name.split()[0])
    return u


@router.post("/login", response_model=UserOut)
def login(body: Credentials, req: Request, resp: Response, users: Users, s: Cfg) -> UserOut:
    if users.throttled(f"{body.email.lower()}|{req.client.host if req.client else ''}"):
        raise HTTPException(status_code=429, detail="Trop de tentatives, réessayez dans une minute")
    got = users.get(body.email)
    ok = check_password(body.password, got[1] if got else DUMMY_HASH)
    if not got or not ok:
        raise HTTPException(status_code=401, detail="E-mail ou mot de passe incorrect")
    _set(resp, got[0], s)
    return got[0]


@router.post("/logout", status_code=204)
def logout(resp: Response) -> None:
    resp.delete_cookie(COOKIE, path="/")


@router.get("/me", response_model=UserOut)
def me(u: Annotated[UserOut | None, Depends(current_user)]) -> UserOut:
    if u is None:
        raise HTTPException(status_code=401, detail="Non connecté")
    return u


@router.post("/forgot", status_code=204)
def forgot(body: Forgot, req: Request, users: Users, s: Cfg, mail: Mailer) -> None:
    """Répond toujours 204 : on ne révèle pas si l'e-mail a un compte."""
    if users.throttled(f"forgot|{body.email.lower()}|{req.client.host if req.client else ''}", limit=3, window=3600):
        return
    if users.get(body.email):
        token = users.new_reset(body.email)
        notify(mail, None, s.site_url, "password_reset", email=body.email, link=f"{s.site_url}/reinitialiser?token={token}")


@router.post("/reset", status_code=204)
def reset(body: Reset, users: Users) -> None:
    if not users.use_reset(body.token, body.password):
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")
