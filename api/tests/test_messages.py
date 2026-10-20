import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.auth.router import get_users
from app.modules.inbox.router import get_store as get_inbox
from app.modules.listings.router import get_store as get_listings
from app.modules.messages import templates as T
from app.modules.messages.send import get_email, get_sms
from app.modules.requests.router import get_store as get_requests

PW = "motdepasse1"
SAMPLE = dict(name="Carine", code="RES-2026-0421", title="Studio <b>Akwa</b>", reason="Bien déjà attribué", doc="attestation", hours=12, owner="Mme Ngo", ref="IB-AKW-003", type="Plomberie", level="Urgent",
              provider="Plomberie du Wouri", report="Cylindre remplacé", amount="90 000 FCFA", delay="2 j", subject="Objet", verdict="en faveur du locataire", text="Bonjour <script>x</script>", link="https://x.cm/r?token=abc")


@pytest.mark.parametrize("event", sorted(T.T))
def test_every_template_renders_branded_and_safe(event):
    m = T.render(event, "https://immobell.cm", **SAMPLE)
    assert m.subject and "{" not in m.subject + m.text + m.sms
    assert 'src="https://immobell.cm/logo.png"' in m.html and "contact@immobell.cm" in m.html
    assert len(m.sms) <= 160
    assert "<script>" not in m.html and "<b>" not in m.html  # valeurs échappées
    if event == "password_reset":
        assert "https://x.cm/r?token=abc" in m.text


def test_classify_notifications():
    assert T.classify("Dossier accepté : votre demande RES-2026-1 est acceptée.") == "request_accepted"
    assert T.classify("Texte quelconque") == "notification"
    assert T.notification("Dossier rejeté : x", "https://immobell.cm").subject == "Dossier rejeté"


class Box:
    def __init__(self):
        self.mails, self.smss = [], []

    def send(self, *a, **k):
        (self.mails if len(a) >= 3 else self.smss).append(a)


@pytest.fixture
def box(monkeypatch):
    monkeypatch.delenv("IMMOBELL_DATABASE_URL", raising=False)
    for f in (get_settings, get_users, get_inbox, get_listings, get_requests):
        f.cache_clear()
    b = Box()
    app.dependency_overrides[get_email] = lambda: b
    app.dependency_overrides[get_sms] = lambda: b
    yield b
    app.dependency_overrides.clear()


def who(email, role="visitor"):
    c = TestClient(app)
    if role == "legal":
        get_users().create(email, "Juriste", role, PW)
        c.post("/api/v1/auth/login", json={"email": email, "password": PW})
    else:
        c.post("/api/v1/auth/register", json={"email": email, "password": PW, "name": "Nadia Foe", "role": role})
    return c


def test_welcome_mail_on_register(box):
    who("n@exemple.cm")
    assert box.mails[0][0] == "n@exemple.cm" and "Bienvenue" in box.mails[0][1]


def test_request_events_send_mail_and_sms(box):
    c, legal = who("c@exemple.cm"), who("j@exemple.cm", "legal")
    req = {"code": "RES-2026-7001", "ref": "IB-BNJ-001", "name": "Carine M", "phone": "690000003", "date": "2026-11-01", "note": "", "status": "validée", "by": "x", "t": 1, "stage": 2}
    c.put("/api/v1/requests/RES-2026-7001", json=req)
    assert any("RES-2026-7001" in m[1] and "reçue" in m[1] for m in box.mails) and box.smss and box.smss[0][0] == "690000003"
    n = len(box.mails)
    legal.put("/api/v1/requests/RES-2026-7001", json={**req, "status": "validée", "stage": 3})
    assert len(box.mails) == n + 1 and "accepté" in box.mails[-1][1] and "accepte" in box.smss[-1][1]
    legal.put("/api/v1/requests/RES-2026-7001", json={**req, "status": "validée", "stage": 4})
    assert len(box.mails) == n + 1  # pas de nouvel envoi sans changement de statut


def test_notification_mailed_to_real_accounts_only(box):
    legal = who("j@exemple.cm", "legal")
    who("c@exemple.cm")
    before = len(box.mails)
    legal.put("/api/v1/inbox", json={"notifs": [{"email": "c@exemple.cm", "text": "Dossier accepté : votre demande RES-2026-1 est acceptée.", "t": 1}, {"email": "inconnu@exemple.cm", "text": "Bonjour", "t": 2}]})
    assert [m[0] for m in box.mails[before:]] == ["c@exemple.cm"]
