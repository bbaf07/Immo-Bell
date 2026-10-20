"""Ports (interfaces) vers les services externes.

Chaque fournisseur (SMS, email, stockage, paiement) est caché derrière une interface :
changer de prestataire = écrire un nouvel adaptateur, sans toucher aux modules métier.
"""

from typing import Protocol


class SmsProvider(Protocol):
    def send(self, phone: str, message: str) -> None: ...


class EmailProvider(Protocol):
    def send(self, to: str, subject: str, body: str, html: str | None = None) -> None: ...


class StorageProvider(Protocol):
    def put(self, key: str, data: bytes, content_type: str) -> str: ...
    def url(self, key: str, expires_s: int = 900) -> str: ...


class PaymentProvider(Protocol):
    """Mobile Money (Orange Money, MTN MoMo) ou carte, selon le prestataire retenu."""

    def create_payment(self, amount_fcfa: int, reference: str, phone: str) -> str: ...


class ConsoleSms:
    """Adaptateur de développement : écrit le SMS dans les logs au lieu de l'envoyer."""

    def send(self, phone: str, message: str) -> None:
        print(f"[SMS dev] {phone[-4:].rjust(len(phone), '*')}: {message}")


class ConsoleEmail:
    """Adaptateur de développement : écrit l'e-mail dans les logs au lieu de l'envoyer."""

    def send(self, to: str, subject: str, body: str, html: str | None = None) -> None:
        print(f"[EMAIL dev] à {to} · {subject}\n{body}")


class SmtpEmail:
    """Envoi réel par SMTP (STARTTLS), configuré par IMMOBELL_SMTP_*."""

    def __init__(self, host: str, port: int, user: str | None, password: str | None, sender: str) -> None:
        self.host, self.port, self.user, self.password, self.sender = host, port, user, password, sender

    def send(self, to: str, subject: str, body: str, html: str | None = None) -> None:
        import smtplib
        from email.message import EmailMessage

        m = EmailMessage()
        m["From"], m["To"], m["Subject"] = self.sender, to, subject
        m.set_content(body)
        if html:
            m.add_alternative(html, subtype="html")
        with smtplib.SMTP(self.host, self.port, timeout=15) as s:
            s.starttls()
            if self.user and self.password:
                s.login(self.user, self.password)
            s.send_message(m)
