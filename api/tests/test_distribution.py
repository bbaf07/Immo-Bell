from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def short_stay_ref() -> str:
    return next(p["ref"] for p in client.get("/api/v1/properties").json() if p["mode"] == "Saisonnière")


def test_facebook_listing_text():
    r = client.get("/api/v1/properties/IB-BNJ-001/distribution/facebook")
    assert r.status_code == 200
    j = r.json()
    assert j["automatic_publishing"] is False
    assert "IB-BNJ-001" in j["text"] and "FCFA" in j["text"] and "#ImmoBell" in j["text"]


def test_instagram_is_capped():
    assert len(client.get("/api/v1/properties/IB-BNJ-001/distribution/instagram").json()["text"]) <= 2200


def test_airbnb_and_booking_only_for_short_stays():
    assert client.get("/api/v1/properties/IB-BNJ-001/distribution/airbnb").status_code == 422
    ref = short_stay_ref()
    for pf in ("airbnb", "booking"):
        r = client.get(f"/api/v1/properties/{ref}/distribution/{pf}")
        assert r.status_code == 200 and r.json()["text"].startswith("TITRE")


def test_bad_inputs():
    assert client.get("/api/v1/properties/IB-BNJ-001/distribution/tiktok").status_code == 422
    assert client.get("/api/v1/properties/IB-XXX-999/distribution/facebook").status_code == 404
