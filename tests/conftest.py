import pytest
from fastapi.testclient import TestClient

from server.app import app, attempts
from server.db import migrate

HEADERS = {"X-IIP-Request": "1"}
PASSWORD = "test-only-long-password-2026"


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("IIP_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("IIP_DATA_MODE", "demo")
    attempts.clear()
    migrate()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def signed_in(client):
    body = {"username": "alice", "password": PASSWORD}
    assert client.post("/api/auth/setup", json=body, headers=HEADERS).status_code == 201
    assert client.post("/api/auth/login", json=body, headers=HEADERS).status_code == 200
    return client
