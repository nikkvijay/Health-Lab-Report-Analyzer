import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from fastapi import HTTPException, status
from bson import ObjectId

from app.services.auth_service import AuthService
from app.models.user import UserCreate, UserLogin, UserUpdate, UserInDB


class TestAuthService:
    @pytest.fixture
    def mock_collection(self):
        """Mock database collection"""
        collection = AsyncMock()
        return collection

    @pytest.fixture
    def mock_db(self, mock_collection):
        """Mock database with collection"""
        db = MagicMock()
        db.users = mock_collection
        return db

    @pytest.fixture
    def auth_service(self, mock_db):
        """Create AuthService instance with mocked database"""
        return AuthService(mock_db)

    @pytest.fixture
    def sample_user_create(self):
        """Sample user creation data"""
        return UserCreate(
            email="test@example.com",
            full_name="Test User",
            password="testpassword123"
        )

    @pytest.fixture
    def sample_user_login(self):
        """Sample user login data"""
        return UserLogin(
            email="test@example.com",
            password="testpassword123"
        )

    @pytest.fixture
    def sample_user_db(self):
        """Sample user from database"""
        return {
            "_id": ObjectId(),
            "email": "test@example.com",
            "full_name": "Test User",
            "hashed_password": "$2b$12$hashedpassword",
            "created_at": datetime.utcnow(),
            "is_active": True
        }

    @pytest.mark.asyncio
    async def test_create_user_success(self, auth_service, mock_collection, sample_user_create):
        """Test successful user creation"""
        # Mock no existing user
        mock_collection.find_one.return_value = None
        
        # Mock successful insertion
        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId()
        mock_collection.insert_one.return_value = mock_result
        
        with patch('app.services.auth_service.get_password_hash') as mock_hash:
            mock_hash.return_value = "hashed_password"
            
            result = await auth_service.create_user(sample_user_create)
            
            assert isinstance(result, UserInDB)
            assert result.email == sample_user_create.email
            assert result.full_name == sample_user_create.full_name
            mock_collection.find_one.assert_called_once_with({"email": sample_user_create.email})
            mock_collection.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_email_already_exists(self, auth_service, mock_collection, sample_user_create, sample_user_db):
        """Test user creation with existing email"""
        # Mock existing user
        mock_collection.find_one.return_value = sample_user_db
        
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.create_user(sample_user_create)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already registered" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, auth_service, mock_collection, sample_user_login, sample_user_db):
        """Test successful user authentication"""
        mock_collection.find_one.return_value = sample_user_db
        mock_collection.update_one.return_value = MagicMock()
        
        with patch('app.services.auth_service.verify_password') as mock_verify:
            mock_verify.return_value = True
            
            result = await auth_service.authenticate_user(sample_user_login)
            
            assert isinstance(result, UserInDB)
            assert result.email == sample_user_login.email
            mock_collection.find_one.assert_called_once_with({"email": sample_user_login.email})
            mock_collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_authenticate_user_not_found(self, auth_service, mock_collection, sample_user_login):
        """Test authentication with non-existent user"""
        mock_collection.find_one.return_value = None
        
        result = await auth_service.authenticate_user(sample_user_login)
        
        assert result is None

    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, auth_service, mock_collection, sample_user_login, sample_user_db):
        """Test authentication with wrong password"""
        mock_collection.find_one.return_value = sample_user_db
        
        with patch('app.services.auth_service.verify_password') as mock_verify:
            mock_verify.return_value = False
            
            result = await auth_service.authenticate_user(sample_user_login)
            
            assert result is None

    @pytest.mark.asyncio
    async def test_get_user_by_email_success(self, auth_service, mock_collection, sample_user_db):
        """Test getting user by email"""
        mock_collection.find_one.return_value = sample_user_db
        
        result = await auth_service.get_user_by_email("test@example.com")
        
        assert isinstance(result, UserInDB)
        assert result.email == "test@example.com"
        mock_collection.find_one.assert_called_once_with({"email": "test@example.com"})

    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, auth_service, mock_collection):
        """Test getting non-existent user by email"""
        mock_collection.find_one.return_value = None
        
        result = await auth_service.get_user_by_email("notfound@example.com")
        
        assert result is None

    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, auth_service, mock_collection, sample_user_db):
        """Test getting user by ID"""
        user_id = str(sample_user_db["_id"])
        mock_collection.find_one.return_value = sample_user_db
        
        result = await auth_service.get_user_by_id(user_id)
        
        assert isinstance(result, UserInDB)
        assert result.email == sample_user_db["email"]

    @pytest.mark.asyncio
    async def test_get_user_by_id_invalid_id(self, auth_service, mock_collection):
        """Test getting user with invalid ID"""
        result = await auth_service.get_user_by_id("invalid_id")
        
        assert result is None

    @pytest.mark.asyncio
    async def test_create_tokens(self, auth_service):
        """Test token creation"""
        user = UserInDB(
            id=str(ObjectId()),
            email="test@example.com",
            full_name="Test User",
            hashed_password="hashed"
        )
        
        with patch('app.services.auth_service.create_access_token') as mock_access, \
             patch('app.services.auth_service.create_refresh_token') as mock_refresh:
            
            mock_access.return_value = "access_token"
            mock_refresh.return_value = "refresh_token"
            
            tokens = auth_service.create_tokens(user)
            
            assert tokens.access_token == "access_token"
            assert tokens.refresh_token == "refresh_token"
            assert tokens.expires_in > 0

    @pytest.mark.asyncio
    async def test_update_user_success(self, auth_service, mock_collection, sample_user_db):
        """Test successful user update"""
        user_id = str(sample_user_db["_id"])
        user_update = UserUpdate(full_name="Updated Name")
        
        # Mock successful update
        mock_result = MagicMock()
        mock_result.modified_count = 1
        mock_collection.update_one.return_value = mock_result
        
        # Mock get_user_by_id for the return
        updated_user_db = sample_user_db.copy()
        updated_user_db["full_name"] = "Updated Name"
        
        with patch.object(auth_service, 'get_user_by_id') as mock_get_user:
            mock_get_user.return_value = UserInDB(**{**updated_user_db, "id": user_id})
            
            result = await auth_service.update_user(user_id, user_update)
            
            assert isinstance(result, UserInDB)
            assert result.full_name == "Updated Name"
            mock_collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_not_found(self, auth_service, mock_collection):
        """Test updating non-existent user"""
        user_id = str(ObjectId())
        user_update = UserUpdate(full_name="Updated Name")
        
        # Mock no changes made (user not found)
        mock_result = MagicMock()
        mock_result.modified_count = 0
        mock_collection.update_one.return_value = mock_result
        
        result = await auth_service.update_user(user_id, user_update)
        
        assert result is None