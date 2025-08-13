import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import get_database
from unittest.mock import AsyncMock


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Create an async test client for the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_db():
    """Mock database connection."""
    mock = AsyncMock()
    return mock


@pytest.fixture(autouse=True)
def override_get_database(mock_db):
    """Override the database dependency for testing."""
    def _get_mock_db():
        return mock_db
    
    app.dependency_overrides[get_database] = _get_mock_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123"
    }


@pytest.fixture
def sample_health_data():
    """Sample health data for testing."""
    return {
        "test_type": "Blood Test",
        "test_date": "2024-01-15",
        "results": {
            "glucose": 95,
            "cholesterol": 180,
            "hemoglobin": 14.2
        }
    }