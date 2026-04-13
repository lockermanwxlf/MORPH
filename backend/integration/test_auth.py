import sys
from pathlib import Path

from azure.cosmos import CosmosClient
import pytest
import pytest_asyncio
from httpx import AsyncClient
from testcontainers.cosmosdb import CosmosDBNoSQLEndpointContainer
import os

root = Path(__file__).parent.parent
if str(root) not in sys.path:
    sys.path.append(str(root))
from main import app


@pytest_asyncio.fixture(scope="session")
async def cosmos_container():
    with CosmosDBNoSQLEndpointContainer() as emulator:
        client = CosmosClient(
            url=emulator.url, credential=emulator.key, connection_verify=False
        )
        db = client.create_database_if_not_exists("test")
        yield container


@pytest_asyncio.fixture(scope="session")
async def anyio_event_loop():
    return None  # Use default anyio loop


@pytest_asyncio.fixture(scope="session")
async def client(cosmos_container):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_register_and_login(client):
    # Test Registration
    payload = {"email": "test@example.com", "password": "securepassword123"}
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 200
    assert response.json() == {"message": "User created successfully"}

    # Test Duplicate Registration
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "User already exists"

    # Test Login
    login_payload = {"username": "test@example.com", "password": "securepassword123"}
    # Note: OAuth2PasswordRequestForm expects form data, not JSON
    response = await client.post("/auth/token", data=login_payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

    # Test Login with wrong password
    login_payload["password"] = "wrongpassword"
    response = await client.post("/auth/token", data=login_payload)
    assert response.status_code == 401
