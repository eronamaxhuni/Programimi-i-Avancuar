import pytest
from app.services.user_service import create_user

def test_create_user_valid():
    user = create_user(email="test@example.com", password="123456", name="Test")
    assert "id" in user
