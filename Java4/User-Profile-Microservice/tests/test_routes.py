import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"

@pytest.mark.asyncio
async def test_create_user_and_login():
    user_data = {
        "email": "testuser@example.com",
        "name": "Test User",
        "password": "testpassword123"
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create user
        res = await ac.post("/users", json=user_data)
        assert res.status_code == 201
        assert "id" in res.json()

        # Login
        login_payload = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        res_login = await ac.post("/auth/login", json=login_payload)
        assert res_login.status_code == 200
        assert "access_token" in res_login.json()
