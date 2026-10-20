import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.applications.router import get_apps
from app.modules.auth.router import get_users

U = {"email": "Nadia@Exemple.cm", "password": "motdepasse1", "name": "Nadia Foe"}


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.delenv("IMMOBELL_STAFF_TOKEN", raising=False)
    monkeypatch.delenv("IMMOBELL_DATABASE_URL", raising=False)
    for f in (get_settings, get_users, get_apps):
        f.cache_clear()
    yield
    for f in (get_settings, get_users, get_apps):
        f.cache_clear()


def test_register_login_me_logout():
    c = TestClient(app)
    r = c.post("/api/v1/auth/register", json=U)
    assert r.status_code == 201 and r.json() == {"email": "nadia@exemple.cm", "name": "Nadia Foe", "role": "visitor"}
    assert "httponly" in r.headers["set-cookie"].lower()
    assert c.get("/api/v1/auth/me").json()["email"] == "nadia@exemple.cm"
    c.post("/api/v1/auth/logout")
    assert c.get("/api/v1/auth/me").status_code == 401
    assert c.post("/api/v1/auth/login", json={"email": U["email"], "password": "faux-mot-de-passe"}).status_code == 401
    assert c.post("/api/v1/auth/login", json={"email": U["email"], "password": U["password"]}).status_code == 200
    assert c.get("/api/v1/auth/me").status_code == 200


def test_duplicate_and_forbidden_roles():
    c = TestClient(app)
    assert c.post("/api/v1/auth/register", json=U).status_code == 201
    assert c.post("/api/v1/auth/register", json=U).status_code == 409
    assert c.post("/api/v1/auth/register", json={**U, "email": "x@y.cm", "role": "admin"}).status_code == 422
    assert c.post("/api/v1/auth/register", json={**U, "email": "z@y.cm", "password": "court"}).status_code == 422


def test_tampered_cookie_rejected():
    c = TestClient(app)
    c.post("/api/v1/auth/register", json=U)
    tok = c.cookies["ib_session"]
    c2 = TestClient(app)
    c2.cookies.set("ib_session", tok[:-2] + ("00" if tok[-2:] != "00" else "11"))
    assert c2.get("/api/v1/auth/me").status_code == 401


def test_staff_routes_need_staff_session():
    c = TestClient(app)
    assert c.get("/api/v1/applications").status_code == 401
    c.post("/api/v1/auth/register", json=U)
    assert c.get("/api/v1/applications").status_code == 403  # client connecté, pas du personnel
    get_users().create("admin@exemple.cm", "Admin", "admin", "motdepasse1")
    a = TestClient(app)
    assert a.post("/api/v1/auth/login", json={"email": "admin@exemple.cm", "password": "motdepasse1"}).status_code == 200
    assert a.get("/api/v1/applications").status_code == 200


def test_login_throttled():
    c = TestClient(app)
    codes = [c.post("/api/v1/auth/login", json={"email": "a@b.cm", "password": "xxxxxxxxx"}).status_code for _ in range(10)]
    assert codes[0] == 401 and codes[-1] == 429


def test_password_reset_flow(monkeypatch):
    sent = []
    from app.modules.messages.send import get_email
    app.dependency_overrides[get_email] = lambda: type("M", (), {"send": lambda self, to, subject, body, html=None: sent.append((to, body))})()
    try:
        c = TestClient(app)
        c.post("/api/v1/auth/register", json=U)
        sent.clear()  # e-mail de bienvenue
        assert c.post("/api/v1/auth/forgot", json={"email": "inconnu@exemple.cm"}).status_code == 204 and sent == []
        assert c.post("/api/v1/auth/forgot", json={"email": U["email"]}).status_code == 204 and len(sent) == 1
        token = sent[0][1].split("token=")[1].split()[0]
        assert c.post("/api/v1/auth/reset", json={"token": token, "password": "nouveaumdp99"}).status_code == 204
        assert c.post("/api/v1/auth/reset", json={"token": token, "password": "autremdp9999"}).status_code == 400  # usage unique
        assert c.post("/api/v1/auth/login", json={"email": U["email"], "password": U["password"]}).status_code == 401
        assert c.post("/api/v1/auth/login", json={"email": U["email"], "password": "nouveaumdp99"}).status_code == 200
    finally:
        app.dependency_overrides.clear()
