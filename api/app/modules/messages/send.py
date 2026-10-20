"""Envoi d'un événement par e-mail et par SMS ; un échec d'envoi ne bloque jamais l'action de l'utilisateur."""

import logging
from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.ports.providers import ConsoleEmail, ConsoleSms, EmailProvider, SmsProvider, SmtpEmail

from .templates import render

log = logging.getLogger("immobell.messages")


def get_email(s: Annotated[Settings, Depends(get_settings)]) -> EmailProvider:
    return SmtpEmail(s.smtp_host, s.smtp_port, s.smtp_user, s.smtp_password, s.smtp_from) if s.smtp_host else ConsoleEmail()


def get_sms() -> SmsProvider:
    return ConsoleSms()  # à remplacer par l'adaptateur du fournisseur retenu (Orange, MTN, agrégateur…)


Mailer = Annotated[EmailProvider, Depends(get_email)]
Texter = Annotated[SmsProvider, Depends(get_sms)]


def notify(mail: EmailProvider, sms: SmsProvider | None, site_url: str, event: str, *, email: str | None = None, phone: str | None = None, **v: object) -> None:
    m = render(event, site_url, **v)
    try:
        if email:
            mail.send(email, m.subject, m.text, m.html)
        if phone and sms and m.sms:
            sms.send(phone, m.sms)
    except Exception:  # noqa: BLE001 - l'envoi est secondaire
        log.exception("envoi %s échoué", event)
