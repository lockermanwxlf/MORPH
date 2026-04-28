import sys
from pathlib import Path
import os

import pytest
from fastapi.testclient import TestClient
from testcontainers.postgres import PostgresContainer

root = Path(__file__).parent.parent
if str(root) not in sys.path:
    sys.path.append(str(root))
from main import app


@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:16") as container:
        raw_url = container.get_connection_url()
        os.environ["DATABASE_URL"] = raw_url.replace(
            "postgresql+psycopg2://", "postgresql://", 1
        )
        yield container


@pytest.fixture()
def client(postgres_container):
    with TestClient(app) as test_client:
        yield test_client


def test_register_and_login(client):
    # Test Registration
    payload = {"email": "test@example.com", "password": "securepassword123"}
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 200
    assert response.json() == {"message": "User created successfully"}

    # Test Duplicate Registration
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "User already exists"

    # Test Login
    login_payload = {"username": "test@example.com", "password": "securepassword123"}
    response = client.post("/auth/token", data=login_payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

    # Test Login with wrong password
    login_payload["password"] = "wrongpassword"
    response = client.post("/auth/token", data=login_payload)
    assert response.status_code == 401


def test_profile_and_lesson_completion(client):
    payload = {"email": "student@example.com", "password": "securepassword123"}
    register_response = client.post("/auth/register", json=payload)
    assert register_response.status_code == 200

    login_response = client.post(
        "/auth/token",
        data={"username": payload["email"], "password": payload["password"]},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    # Create or update profile
    profile_response = client.put(
        "/users/me/profile",
        json={"grade_level": "6-12"},
        headers=auth_header,
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["grade_level"] == "6-12"

    # Fetch profile
    get_profile_response = client.get("/users/me/profile", headers=auth_header)
    assert get_profile_response.status_code == 200
    assert get_profile_response.json() == {
        "email": payload["email"],
        "grade_level": "6-12",
    }

    invalid_profile_response = client.put(
        "/users/me/profile",
        json={"grade_level": "6"},
        headers=auth_header,
    )
    assert invalid_profile_response.status_code == 422

    # Mark lessons complete and verify duplicates are ignored
    assert (
        client.post(
            "/progress/me/lessons/lesson-1/complete", headers=auth_header
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/progress/me/lessons/lesson-2/complete", headers=auth_header
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/progress/me/lessons/lesson-1/complete", headers=auth_header
        ).status_code
        == 200
    )

    completed_response = client.get(
        "/progress/me/lessons/completed", headers=auth_header
    )
    assert completed_response.status_code == 200
    assert completed_response.json() == {"lesson_ids": ["lesson-1", "lesson-2"]}
