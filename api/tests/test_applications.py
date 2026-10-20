import io
import zipfile

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.applications.router import get_apps

client = TestClient(app)
STAFF = {"Authorization": "Bearer test-token"}
BODY = {"ref": "IB-BNJ-001", "name": "Carine Mbarga", "phone": "690000003", "email": "carine@exemple.cm", "situation": "CDI", "income": 1250000}


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.setenv("IMMOBELL_STAFF_TOKEN", "test-token")
    get_settings.cache_clear()
    get_apps.cache_clear()
    yield
    get_settings.cache_clear()
    get_apps.cache_clear()


def make() -> str:
    r = client.post("/api/v1/applications", json=BODY)
    assert r.status_code == 201 and r.json()["status"] == "en_analyse"
    return r.json()["code"]


def test_unknown_property_is_404():
    assert client.post("/api/v1/applications", json={**BODY, "ref": "IB-XXX-999"}).status_code == 404


def test_staff_routes_require_token():
    assert client.get("/api/v1/applications").status_code == 401
    assert client.get("/api/v1/applications", headers={"Authorization": "Bearer nope"}).status_code == 401
    assert client.get("/api/v1/applications", headers=STAFF).status_code == 200


def test_staff_routes_closed_without_config(monkeypatch):
    monkeypatch.delenv("IMMOBELL_STAFF_TOKEN")
    get_settings.cache_clear()
    assert client.get("/api/v1/applications", headers=STAFF).status_code == 401


def test_rejection_requires_reason():
    code = make()
    url = f"/api/v1/applications/{code}/decision"
    assert client.patch(url, json={"status": "rejete"}, headers=STAFF).status_code == 422
    assert client.patch(url, json={"status": "accepte", "reason": "Autre motif"}, headers=STAFF).status_code == 422
    assert client.patch(url, json={"status": "en_analyse"}, headers=STAFF).status_code == 422
    r = client.patch(url, json={"status": "rejete", "reason": "Bien déjà attribué", "note": "Dossier complet retenu avant"}, headers=STAFF)
    assert r.status_code == 200 and r.json()["reason"] == "Bien déjà attribué" and r.json()["history"][-1]["action"].startswith("Dossier rejeté")


def test_accept_and_filter_by_status():
    a, b = make(), make()
    client.patch(f"/api/v1/applications/{a}/decision", json={"status": "accepte"}, headers=STAFF)
    acc = client.get("/api/v1/applications", params={"status": "accepte"}, headers=STAFF).json()
    assert [x["code"] for x in acc] == [a]
    assert [x["code"] for x in client.get("/api/v1/applications", params={"status": "en_analyse"}, headers=STAFF).json()] == [b]


def test_export_zip_contents_and_audit():
    code = make()
    client.patch(f"/api/v1/applications/{code}/decision", json={"status": "rejete", "reason": "Solvabilité insuffisante"}, headers=STAFF)
    assert client.get(f"/api/v1/applications/{code}/export").status_code == 401
    r = client.get(f"/api/v1/applications/{code}/export", headers=STAFF)
    assert r.status_code == 200 and r.headers["content-type"] == "application/zip" and "no-store" in r.headers["cache-control"]
    z = zipfile.ZipFile(io.BytesIO(r.content))
    assert set(z.namelist()) == {"liste.csv", f"{code}/fiche.txt"}
    assert z.read("liste.csv").startswith("﻿".encode())
    assert "Solvabilité insuffisante" in z.read(f"{code}/fiche.txt").decode()
    assert any(a.startswith("export:dossier:") for _, a in get_apps().audit_log())


def test_export_by_property_and_tenant():
    make()
    assert client.get("/api/v1/applications/export/property/IB-BNJ-001", headers=STAFF).status_code == 200
    assert client.get("/api/v1/applications/export/property/IB-BNJ-002", headers=STAFF).status_code == 404
    assert client.get("/api/v1/applications/export/tenant", params={"email": "CARINE@exemple.cm"}, headers=STAFF).status_code == 200
    assert client.get("/api/v1/applications/export/all", headers=STAFF).status_code == 200


def test_csv_formula_injection_is_neutralised():
    r = client.post("/api/v1/applications", json={**BODY, "name": "=HYPERLINK(\"http://x\")"})
    assert r.status_code == 201
    z = zipfile.ZipFile(io.BytesIO(client.get("/api/v1/applications/export/all", headers=STAFF).content))
    assert "'=HYPERLINK" in z.read("liste.csv").decode("utf-8-sig")
