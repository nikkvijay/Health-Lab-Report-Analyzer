import pytest
from fastapi.testclient import TestClient
from app.main import app
import io

client = TestClient(app)

def get_auth_token():
    """Helper to get auth token"""
    response = client.post(
        "/auth/signup",
        json={
            "email": "upload_test@example.com",
            "password": "password123",
            "name": "Upload Test User"
        }
    )
    return response.json()["access_token"]

def test_file_upload():
    """Test file upload"""
    token = get_auth_token()
    
    # Create a simple test file
    test_file_content = b"Test PDF content for lab report"
    test_file = io.BytesIO(test_file_content)
    
    response = client.post(
        "/api/upload",
        files={"file": ("test_report.pdf", test_file, "application/pdf")},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "file_id" in data
    assert data["status"] == "uploaded"

def test_upload_without_auth():
    """Test upload without authentication"""
    test_file_content = b"Test content"
    test_file = io.BytesIO(test_file_content)
    
    response = client.post(
        "/api/upload",
        files={"file": ("test.pdf", test_file, "application/pdf")}
    )
    
    assert response.status_code == 401

def test_invalid_file_type():
    """Test upload with invalid file type"""
    token = get_auth_token()
    
    test_file_content = b"Test content"
    test_file = io.BytesIO(test_file_content)
    
    response = client.post(
        "/api/upload",
        files={"file": ("test.txt", test_file, "text/plain")},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 400

# ===== pytest.ini =====
[tool:pytest]
testpaths = app/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
