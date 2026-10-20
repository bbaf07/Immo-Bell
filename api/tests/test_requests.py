import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.auth.router import get_users
from app.modules.listings.router import get_store as get_listings
from app.modules.requests.router import get_store

PW = "motdepasse1"
ALL = (get_settings, get_users, get_listings, get_store)


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.delenv("IMMOBELL_DATABASE_URL", raising=False)
    for f in ALL:
        f.cache_clear()
    yield
    for f in ALL:
        f.cache_clear()


def who(email, role="visitor"):
    c = TestClient(app)
    if role in ("admin", "legal"):
        get_users().create(email, "Staff", role, PW)
        c.post("/api/v1/auth/login", json={"email": email, "password": PW})
    else:
        c.post("/api/v1/auth/register", json={"email": email, "password": PW, "name": "Un Nom", "role": role})
    return c


def req(code="RES-2026-7001", **kw):
    return {"code": code, "ref": "IB-BNJ-001", "name": "Carine M", "phone": "690000003", "date": "2026-11-01", "note": "", "status": "validée", "by": "pirate@x.cm", "t": 1, "stage": 5, "decided": {"by": "moi"}, **kw}


def test_create_forces_owner_and_initial_state():
    c = who("carine@exemple.cm")
    r = c.put("/api/v1/requests/RES-2026-7001", json=req())
    assert r.status_code == 200
    j = r.json()
    assert j["by"] == "carine@exemple.cm" and j["status"] == "en attente" and j["stage"] == 2 and "decided" not in j


def test_visibility_and_isolation():
    a, b = who("a@exemple.cm"), who("b@exemple.cm")
    a.put("/api/v1/requests/RES-2026-7001", json=req())
    assert [r["code"] for r in a.get("/api/v1/requests").json()] == ["RES-2026-7001"]
    assert b.get("/api/v1/requests").json() == []
    b.put("/api/v1/requests/RES-2026-7001", json=req(status="annulée"))  # ne touche pas la demande de a
    assert a.get("/api/v1/requests").json()[0]["status"] == "en attente"
    assert TestClient(app).get("/api/v1/requests").status_code == 401
    assert "RES-2026-7001" in [r["code"] for r in who("j@immobell.cm", "legal").get("/api/v1/requests").json()]


def test_client_cannot_decide_but_can_cancel_and_legal_decides():
    a, legal = who("a@exemple.cm"), who("j@immobell.cm", "legal")
    a.put("/api/v1/requests/RES-2026-7001", json=req())
    assert a.put("/api/v1/requests/RES-2026-7001", json=req(status="validée", stage=5)).json()["status"] == "en attente"
    assert legal.put("/api/v1/requests/RES-2026-7001", json=req(status="validée", stage=3)).json()["status"] == "validée"
    assert a.put("/api/v1/requests/RES-2026-7001", json=req(status="annulée", cancel={"why": "x"})).json()["status"] == "annulée"


def test_unknown_property_and_owner_sees_requests_on_own_listings():
    a = who("a@exemple.cm")
    assert a.put("/api/v1/requests/RES-2026-7002", json=req("RES-2026-7002", ref="IB-ZZZ-999")).status_code == 404
    o = who("prop@exemple.cm", "owner")
    o.put("/api/v1/listings/IB-DEI-150", json={"ref": "IB-DEI-150", "title": "Studio", "type": "Studio", "mode": "Location", "q": "Deido", "price": 1, "rooms": 1, "surface": 1, "owner": "x"})
    a.put("/api/v1/requests/RES-2026-7003", json=req("RES-2026-7003", ref="IB-DEI-150"))
    assert [r["code"] for r in o.get("/api/v1/requests").json()] == ["RES-2026-7003"]


def test_code_collision_gets_a_free_code():
    a, b = who("a@exemple.cm"), who("b@exemple.cm")
    a.put("/api/v1/requests/RES-2026-7001", json=req())
    r = b.put("/api/v1/requests/RES-2026-7001", json=req())
    assert r.status_code == 200 and r.json()["code"] != "RES-2026-7001" and r.json()["by"] == "b@exemple.cm"
    assert [x["code"] for x in a.get("/api/v1/requests").json()] == ["RES-2026-7001"]
