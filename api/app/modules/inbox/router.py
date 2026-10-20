from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.modules.auth.router import current_user, get_users
from app.modules.auth.service import UserOut, UserStore

from app.modules.messages.send import Mailer
from app.modules.messages.templates import notification

from .service import STAFF, Denied, InboxStore, Msg, Notif, authorize, key_of

router = APIRouter(prefix="/api/v1/inbox", tags=["inbox"])


@lru_cache
def get_store() -> InboxStore:
    return InboxStore(get_settings().database_url)


Store = Annotated[InboxStore, Depends(get_store)]
Users = Annotated[UserStore, Depends(get_users)]
Me = Annotated[UserOut | None, Depends(current_user)]


class Inbox(BaseModel):
    notifs: list[Notif]
    msgs: list[Msg]


class Batch(BaseModel):
    notifs: list[Notif] = Field(default_factory=list, max_length=50)
    msgs: list[Msg] = Field(default_factory=list, max_length=50)


def _me(me: UserOut | None) -> UserOut:
    if me is None:
        raise HTTPException(status_code=401, detail="Connexion requise")
    return me


@router.get("", response_model=Inbox)
def read(store: Store, me: Me) -> Inbox:
    u = _me(me)
    staff_all = u.role in ("admin", "legal")
    return Inbox(notifs=store.list("notif", u.email), msgs=store.list("msg", None if staff_all else u.email))  # type: ignore[arg-type]


@router.put("", response_model=Inbox)
def write(body: Batch, store: Store, users: Users, me: Me, mail: Mailer, cfg: Annotated[Settings, Depends(get_settings)]) -> Inbox:
    """Enregistre un lot ; les éléments refusés sont ignorés (le client relit ensuite l'état du serveur)."""
    u = _me(me)
    for kind, items in (("notif", body.notifs), ("msg", body.msgs)):
        for o in items:
            target = users.get(o.email) if isinstance(o, Notif) else None
            try:
                out = authorize(u.role, u.email, store.get(kind, key_of(kind, o)), o, bool(target and target[0].role in STAFF))  # type: ignore[arg-type]
            except Denied:
                continue
            fresh = store.get(kind, key_of(kind, o)) is None
            store.put(kind, out)  # type: ignore[arg-type]
            if fresh and isinstance(o, Notif) and target and o.email != u.email:  # e-mail au destinataire d'un compte réel
                m = notification(o.text, cfg.site_url)
                try:
                    mail.send(o.email, m.subject, m.text, m.html)
                except Exception:  # noqa: BLE001 - l'e-mail est secondaire
                    pass
    return read(store, me)
