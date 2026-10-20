import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.auth.router import get_users
from app.modules.records.router import get_store

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
    if role in ("admin", "legal", "provider"):
        get_users().create(email, role.title(), role, PW)
        c.post("/api/v1/auth/login", json={"email": email, "password": PW})
    else:
        c.post("/api/v1/auth/register", json={"email": email, "password": PW, "name": "Nom " + email[:1], "role": role})
    return c


def put(c, kind, *items):
    r = c.put(f"/api/v1/records?kind={kind}", json={"items": list(items)})
    assert r.status_code == 200
    return [x["data"] for x in r.json()]


def get(c, kind):
    return c.get(f"/api/v1/records?kind={kind}").json()


QUOTE = {"code": "DEV-7001", "type": "Plomberie", "from": "A", "to": "B", "date": "2026-11-02", "phone": "6", "note": "", "t": 1, "status": "signé", "amount": 1, "by": "x@x.cm"}
INC = {"code": "URG-7001", "ref": "IB-BNJ-001", "type": "Plomberie", "profil": "Locataire", "desc": "Fuite", "phone": "6", "level": "Urgent", "t": 1, "status": "clôturé"}


def test_quote_create_strips_privileged_and_isolates():
    a, b = who("a@exemple.cm"), who("b@exemple.cm")
    q = put(a, "quote", QUOTE)[0]
    assert q["by"] == "a@exemple.cm" and q["status"] == "reçu" and "amount" not in q
    assert get(b, "quote") == [] and len(get(a, "quote")) == 1
    assert TestClient(app).get("/api/v1/records?kind=quote").json() == []


def test_collision_gets_new_code():
    a, b = who("a@exemple.cm"), who("b@exemple.cm")
    put(a, "incident", INC)
    r = put(b, "incident", INC)[0]
    assert r["code"] != "URG-7001" and r["by"] == "b@exemple.cm"
    assert {i["code"] for i in get(who("adm@immobell.cm", "admin"), "incident")} == {"URG-7001", r["code"]}


def test_provider_only_its_assignments_and_admin_assigns():
    a, adm, p1, p2 = who("a@exemple.cm"), who("adm@immobell.cm", "admin"), who("p1@exemple.cm", "provider"), who("p2@exemple.cm", "provider")
    put(a, "quote", QUOTE)
    put(adm, "quote", {**QUOTE, "by": "a@exemple.cm", "status": "attribué", "prest": "p1", "prestEmail": "p1@exemple.cm"})
    assert get(p2, "quote") == [] and len(get(p1, "quote")) == 1
    r = put(p1, "quote", {**QUOTE, "status": "devis envoyé", "amount": 90000, "delay": "2 j", "by": "evil", "code": "DEV-7001"})[0]
    assert r["amount"] == 90000 and r["by"] == "a@exemple.cm" and r["status"] == "devis envoyé"
    assert get(adm, "quote")[0]["amount"] == 90000


def test_cases_parties_and_contest_rules():
    a, b, adm = who("a@exemple.cm"), who("b@exemple.cm"), who("adm@immobell.cm", "admin")
    c = {"code": "LIT-7001", "kind": "litige", "objet": "Dépôt", "against": "b@exemple.cm", "againstName": "B", "desc": "d", "t": 1, "replyDue": 2, "hist": [], "status": "résolu", "lvl": 2, "assignee": "adm"}
    got = put(a, "case", c)[0]
    assert got["status"] == "ouvert" and got["lvl"] == 1 and got["assignee"] is None and got["byName"] == "Nom a"
    assert len(get(b, "case")) == 1 and get(who("z@exemple.cm"), "case") == []
    assert put(a, "case", {**c, "reply": {"t": 1, "text": "moi"}}, )[0]["reply"] is None  # le demandeur ne répond pas à sa propre plainte
    assert put(b, "case", {**c, "reply": {"t": 2, "text": "réponse"}, "hist": [{"t": 2, "who": "B", "act": "Réponse"}]})[0]["reply"]["text"] == "réponse"
    assert put(b, "case", {**c, "status": "résolu"})[0]["status"] == "ouvert"


def test_reviews_public_moderated_by_admin_only():
    a, adm = who("a@exemple.cm"), who("adm@immobell.cm", "admin")
    r = put(a, "review", {"ref": "IB-BNJ-001", "stars": 5, "text": "Super", "t": 5, "who": "Imposteur"})[0]
    assert r["who"] == "Nom a" and r["by"] == "a@exemple.cm"
    assert any(x["who"] == "Nom a" for x in TestClient(app).get("/api/v1/records?kind=review").json())
    assert put(a, "review", {**r, "removed": True}) == []
    assert put(adm, "review", {**r, "removed": True})[0]["removed"] is True
    assert put(a, "review", {"ref": "IB-BNJ-001", "stars": 9, "text": "x", "t": 6}) == []


def test_favs_are_private_per_user():
    a, b = who("a@exemple.cm"), who("b@exemple.cm")
    put(a, "fav", {"refs": ["IB-BNJ-001"]})
    assert get(a, "fav")[0]["refs"] == ["IB-BNJ-001"] and get(b, "fav") == []
