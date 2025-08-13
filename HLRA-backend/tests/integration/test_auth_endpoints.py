import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.integration
class TestAuthEndpoints:
    
    @pytest.mark.asyncio
    async def test_register_user_success(self, async_client: AsyncClient):
        """Test successful user registration"""
        user_data = {
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "securepassword123"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == user_data["email"]

    @pytest.mark.asyncio
    async def test_register_user_invalid_email(self, async_client: AsyncClient):
        """Test user registration with invalid email"""
        user_data = {
            "email": "invalid-email",
            "full_name": "Test User",
            "password": "password123"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_register_user_short_password(self, async_client: AsyncClient):
        """Test user registration with short password"""
        user_data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "123"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient, sample_user_data):
        """Test successful login"""
        # First register a user
        await async_client.post("/api/v1/auth/register", json=sample_user_data)
        
        # Then try to login
        login_data = {
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, async_client: AsyncClient):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_login_missing_fields(self, async_client: AsyncClient):
        """Test login with missing required fields"""
        response = await async_client.post("/api/v1/auth/login", json={})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_protected_route_without_token(self, async_client: AsyncClient):
        """Test accessing protected route without token"""
        response = await async_client.get("/api/v1/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_protected_route_with_valid_token(self, async_client: AsyncClient, sample_user_data):
        """Test accessing protected route with valid token"""
        # Register and login to get token
        await async_client.post("/api/v1/auth/register", json=sample_user_data)
        login_response = await async_client.post("/api/v1/auth/login", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await async_client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == sample_user_data["email"]

    @pytest.mark.asyncio
    async def test_protected_route_with_invalid_token(self, async_client: AsyncClient):
        """Test accessing protected route with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        
        response = await async_client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, async_client: AsyncClient, sample_user_data):
        """Test successful token refresh"""
        # Register and login to get tokens
        await async_client.post("/api/v1/auth/register", json=sample_user_data)
        login_response = await async_client.post("/api/v1/auth/login", json={
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        })
        
        refresh_token = login_response.json()["refresh_token"]
        
        response = await async_client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, async_client: AsyncClient):
        """Test token refresh with invalid token"""
        response = await async_client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid_token"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED