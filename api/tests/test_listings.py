import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.auth.router import get_users
from app.modules.listings.router import get_store

PW = "motdepasse1"


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.delenv("IMMOBELL_DATABASE_URL", raising=False)
    for f in (get_settings, get_users, get_store):
        f.cache_clear()
    yield
    for f in (get_settings, get_users, get_store):
        f.cache_clear()


def login(email: str, role: str = "owner") -> TestClient:
    c = TestClient(app)
    if role in ("admin", "legal"):
        get_users().create(email, "Staff", role, PW)
        assert c.post("/api/v1/auth/login", json={"email": email, "password": PW}).status_code == 200
    else:
        assert c.post("/api/v1/auth/register", json={"email": email, "password": PW, "name": "Un Nom", "role": role}).status_code == 201
    return c


def new(ref="IB-DEI-090", **kw):
    return {"ref": ref, "title": "Studio neuf", "type": "Studio", "mode": "Location", "q": "Deido", "price": 90000, "rooms": 1, "surface": 25,
            "status": "libre", "validation": "validé", "owner": "x@y.cm", "views": 999, **kw}


def test_public_sees_only_validated():
    items = TestClient(app).get("/api/v1/listings").json()
    assert items and all(p["validation"] == "validé" for p in items)


def test_owner_cannot_self_validate_and_admin_decides():
    o, a = login("prop@exemple.cm"), login("admin@exemple.cm", "admin")
    r = o.put("/api/v1/listings/IB-DEI-090", json=new())
    assert r.status_code == 200 and r.json()["validation"] == "en attente" and r.json()["owner"] == "prop@exemple.cm" and r.json()["views"] == 0
    assert "IB-DEI-090" not in [p["ref"] for p in TestClient(app).get("/api/v1/listings").json()]
    assert "IB-DEI-090" in [p["ref"] for p in o.get("/api/v1/listings").json()]
    assert o.post("/api/v1/listings/IB-DEI-090/validation?decision=validé").status_code == 403
    assert a.post("/api/v1/listings/IB-DEI-090/validation?decision=validé").json()["validation"] == "validé"
    assert "IB-DEI-090" in [p["ref"] for p in TestClient(app).get("/api/v1/listings").json()]
    # un changement majeur renvoie en validation, un changement de prix non
    assert o.put("/api/v1/listings/IB-DEI-090", json=new(price=95000, validation="validé")).json()["validation"] == "validé"
    assert o.put("/api/v1/listings/IB-DEI-090", json=new(surface=30, validation="validé")).json()["validation"] == "en attente"


def test_foreign_and_anonymous_writes_denied():
    assert TestClient(app).put("/api/v1/listings/IB-BNJ-001", json=new("IB-BNJ-001")).status_code == 401
    assert login("a@exemple.cm").put("/api/v1/listings/IB-BNJ-001", json=new("IB-BNJ-001")).status_code == 403
    assert login("c@exemple.cm", "visitor").put("/api/v1/listings/IB-DEI-091", json=new("IB-DEI-091")).status_code == 403


def test_legal_only_changes_status():
    l = login("juriste@exemple.cm", "legal")
    r = l.put("/api/v1/listings/IB-BNJ-001", json=new("IB-BNJ-001", status="réservé", title="Piraté"))
    assert r.status_code == 200 and r.json()["status"] == "réservé" and r.json()["title"] != "Piraté"
