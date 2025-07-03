import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_signup():
    """Test user signup"""
    response = client.post(
        "/auth/signup",
        json={
            "email": "test@example.com",
            "password": "password123",
            "name": "Test User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"

def test_login():
    """Test user login"""
    # First signup
    client.post(
        "/auth/signup",
        json={
            "email": "test2@example.com", 
            "password": "password123",
            "name": "Test User 2"
        }
    )
    
    # Then login
    response = client.post(
        "/auth/login",
        json={
            "email": "test2@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_invalid_login():
    """Test invalid login"""
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_get_current_user():
    """Test getting current user info"""
    # Signup first
    signup_response = client.post(
        "/auth/signup",
        json={
            "email": "test3@example.com",
            "password": "password123", 
            "name": "Test User 3"
        }
    )
    token = signup_response.json()["access_token"]
    
    # Get user info
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test3@example.com"