from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_list_all():
    r = client.get("/api/v1/properties")
    assert r.status_code == 200
    assert len(r.json()) == 16


def test_filters():
    r = client.get("/api/v1/properties", params={"quartier": "Bonanjo", "status": "libre"})
    assert r.status_code == 200
    assert r.json() and all(p["q"] == "Bonanjo" and p["status"] == "libre" for p in r.json())


def test_page_size_is_capped():
    r = client.get("/api/v1/properties", params={"limit": 10_000})
    assert r.status_code == 200 and len(r.json()) <= 100


def test_detail_and_404():
    assert client.get("/api/v1/properties/IB-BNJ-001").json()["q"] == "Bonanjo"
    assert client.get("/api/v1/properties/IB-XXX-999").status_code == 404
    assert client.get("/api/v1/properties/../../etc").status_code in (404, 422)


def test_no_internal_fields_exposed():
    p = client.get("/api/v1/properties/IB-BNJ-001").json()
    assert "owner" not in p and "validation" not in p
