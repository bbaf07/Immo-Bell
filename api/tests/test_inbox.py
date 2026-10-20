import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.auth.router import get_users
from app.modules.inbox.router import get_store

PW = "motdepasse1"


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.delenv("IMMOBELL_DATABASE_URL", raising=False)
    for f in (get_settings, get_users, get_store):
        f.cache_clear()
    yield
    for f in (get_settings, get_users, get_store):
        f.cache_clear()


def who(email, role="visitor"):
    c = TestClient(app)
    if role in ("admin", "legal"):
        get_users().create(email, "Staff", role, PW)
        c.post("/api/v1/auth/login", json={"email": email, "password": PW})
    else:
        c.post("/api/v1/auth/register", json={"email": email, "password": PW, "name": "Un Nom", "role": role})
    return c


def n(email, text="Bonjour", t=1, **kw):
    return {"email": email, "text": text, "t": t, "read": False, **kw}


def test_staff_notifies_client_who_reads_and_marks_read():
    a, adm = who("a@exemple.cm"), who("adm@immobell.cm", "admin")
    r = adm.put("/api/v1/inbox", json={"notifs": [n("a@exemple.cm", "Dossier accepté", go={"v": "espace", "tab": "res"})]})
    assert r.status_code == 200
    got = a.get("/api/v1/inbox").json()["notifs"]
    assert [x["text"] for x in got] == ["Dossier accepté"]
    a.put("/api/v1/inbox", json={"notifs": [n("a@exemple.cm", "Dossier accepté", read=True, text_="x")]})
    assert a.get("/api/v1/inbox").json()["notifs"][0]["read"] is True


def test_client_cannot_notify_other_clients_but_can_notify_admins_and_self():
    a, b = who("a@exemple.cm"), who("b@exemple.cm")
    who("adm@immobell.cm", "admin")
    a.put("/api/v1/inbox", json={"notifs": [n("b@exemple.cm", "Spam"), n("adm@immobell.cm", "Nouvelle demande"), n("a@exemple.cm", "Reçu")]})
    assert b.get("/api/v1/inbox").json()["notifs"] == []
    assert sorted(x["text"] for x in a.get("/api/v1/inbox").json()["notifs"]) == ["Reçu"]


def test_messages_thread_rules():
    a, b, adm = who("a@exemple.cm"), who("b@exemple.cm"), who("adm@immobell.cm", "admin")
    a.put("/api/v1/inbox", json={"msgs": [{"with": "a@exemple.cm", "from": "me", "text": "Bonjour", "t": 1}, {"with": "b@exemple.cm", "from": "me", "text": "Usurpation", "t": 2}, {"with": "a@exemple.cm", "from": "immo", "text": "Faux", "t": 3}]})
    assert [m["text"] for m in adm.get("/api/v1/inbox").json()["msgs"]] == ["Bonjour"]
    adm.put("/api/v1/inbox", json={"msgs": [{"with": "a@exemple.cm", "from": "immo", "text": "Réponse", "t": 4, "unread": True}]})
    assert {m["text"] for m in a.get("/api/v1/inbox").json()["msgs"]} == {"Bonjour", "Réponse"}
    assert b.get("/api/v1/inbox").json()["msgs"] == []
    assert TestClient(app).get("/api/v1/inbox").status_code == 401
