# HLRA Testing Guide

This document provides comprehensive testing guidelines for the Health Lab Report Analyzer (HLRA) project.

## 📋 Table of Contents

- [Testing Architecture](#testing-architecture)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🏗️ Testing Architecture

The HLRA project uses a comprehensive testing strategy with different types of tests:

### Frontend Testing Stack
- **Framework**: Vitest (fast, ESM-native test runner)
- **React Testing**: React Testing Library
- **DOM Environment**: jsdom
- **Mocking**: Vitest's built-in mocking capabilities
- **User Interactions**: @testing-library/user-event

### Backend Testing Stack
- **Framework**: pytest (Python's de facto testing framework)
- **Async Testing**: pytest-asyncio
- **Coverage**: pytest-cov
- **HTTP Testing**: httpx AsyncClient
- **Database Mocking**: unittest.mock

## 🎨 Frontend Testing

### Setup and Configuration

The frontend testing is configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

### Test Structure

```
HLRA-frontend/src/
├── components/
│   ├── ui/
│   │   └── __tests__/
│   │       └── button.test.tsx
│   └── auth/
│       └── __tests__/
│           └── LoginPage.test.tsx
├── utils/
│   └── __tests__/
│       └── dateUtils.test.ts
└── test/
    └── setup.ts
```

### Available Commands

```bash
cd HLRA-frontend

# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Frontend Tests

#### Component Testing Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### Mocking Context Providers

```typescript
// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    isLoading: false,
  })
}))
```

## 🐍 Backend Testing

### Setup and Configuration

Backend testing is configured in `pytest.ini`:

```ini
[tool:pytest]
testpaths = tests
addopts = -v --tb=short --cov=app --cov-report=html
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow tests
```

### Test Structure

```
HLRA-backend/tests/
├── conftest.py              # Shared fixtures
├── unit/
│   └── test_auth_service.py # Unit tests
├── integration/
│   └── test_auth_endpoints.py # Integration tests
└── fixtures/
    └── sample_data.py       # Test data
```

### Available Commands

```bash
cd HLRA-backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test types
pytest -m unit      # Unit tests only
pytest -m integration  # Integration tests only

# Run specific test file
pytest tests/unit/test_auth_service.py

# Run with verbose output
pytest -v

# Stop after first failure
pytest -x
```

### Writing Backend Tests

#### Unit Test Example

```python
@pytest.mark.asyncio
async def test_create_user_success(auth_service, mock_collection, sample_user_create):
    """Test successful user creation"""
    mock_collection.find_one.return_value = None
    mock_result = MagicMock()
    mock_result.inserted_id = ObjectId()
    mock_collection.insert_one.return_value = mock_result
    
    with patch('app.services.auth_service.get_password_hash') as mock_hash:
        mock_hash.return_value = "hashed_password"
        result = await auth_service.create_user(sample_user_create)
        assert isinstance(result, UserInDB)
```

#### Integration Test Example

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_register_user_success(async_client: AsyncClient):
    """Test successful user registration via API"""
    user_data = {
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "securepassword123"
    }
    
    response = await async_client.post("/api/v1/auth/register", json=user_data)
    
    assert response.status_code == 201
    assert "access_token" in response.json()
```

## 🚀 Running Tests

### Local Development

#### Quick Test Run
```bash
# From project root
./run-tests.sh
```

#### Individual Test Suites
```bash
# Frontend only
cd HLRA-frontend && npm run test:run

# Backend only
cd HLRA-backend && python -m pytest
```

### CI/CD Pipeline

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

The pipeline includes:
1. **Frontend Tests**: Linting, type checking, unit tests, build verification
2. **Backend Tests**: Unit tests, integration tests with MongoDB
3. **E2E Tests**: (Optional) Full application testing

## 📊 Test Coverage

### Coverage Goals
- **Frontend**: Aim for 80%+ coverage
- **Backend**: Aim for 85%+ coverage
- **Critical paths**: 95%+ coverage (auth, data processing)

### Viewing Coverage Reports

#### Frontend
```bash
cd HLRA-frontend
npm run test:coverage
# Open coverage/index.html in browser
```

#### Backend
```bash
cd HLRA-backend
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

## 📝 Writing Tests

### Test Categories

#### 1. Unit Tests
- Test individual functions/components in isolation
- Mock external dependencies
- Fast execution (< 1ms per test)

```typescript
// Frontend unit test
describe('calculateAge', () => {
  it('calculates age correctly', () => {
    expect(calculateAge('1990-01-15')).toBe(34)
  })
})
```

```python
# Backend unit test
def test_hash_password():
    password = "test123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
```

#### 2. Integration Tests
- Test component interactions
- Test API endpoints with database
- Moderate execution time

```python
@pytest.mark.integration
async def test_login_flow(async_client):
    # Register user
    await async_client.post("/auth/register", json=user_data)
    
    # Login
    response = await async_client.post("/auth/login", json=login_data)
    assert response.status_code == 200
```

#### 3. Component Tests (Frontend)
- Test React components with user interactions
- Mock external APIs and contexts

```typescript
describe('LoginPage', () => {
  it('submits form with valid data', async () => {
    const mockLogin = vi.fn()
    // Setup mocks and render component
    // Simulate user interactions
    // Assert expected behavior
  })
})
```

### Test Naming Conventions

#### Frontend
- Files: `ComponentName.test.tsx` or `utilityName.test.ts`
- Test names: Descriptive sentences starting with "should" or present tense

```typescript
describe('Button', () => {
  it('renders with correct text')
  it('calls onClick when clicked')
  it('shows loading state when disabled')
})
```

#### Backend
- Files: `test_module_name.py`
- Test names: `test_function_name_condition_expected_result`

```python
def test_create_user_with_existing_email_raises_exception():
def test_authenticate_user_with_valid_credentials_returns_user():
def test_get_user_by_invalid_id_returns_none():
```

### Mocking Guidelines

#### Frontend Mocking
```typescript
// Mock entire modules
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

// Mock specific functions
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))
```

#### Backend Mocking
```python
# Mock database operations
@pytest.fixture
def mock_collection():
    collection = AsyncMock()
    collection.find_one.return_value = None
    return collection

# Mock external services
with patch('app.services.email_service.send_email') as mock_send:
    mock_send.return_value = True
    # Test code here
```

## 🔧 Best Practices

### General Testing Principles

1. **Test Behavior, Not Implementation**
   ```typescript
   // Good: Tests behavior
   expect(screen.getByRole('button')).toBeInTheDocument()
   
   // Bad: Tests implementation
   expect(component.state.isVisible).toBe(true)
   ```

2. **Write Descriptive Test Names**
   ```python
   # Good
   def test_authenticate_user_with_wrong_password_returns_none():
   
   # Bad
   def test_auth():
   ```

3. **Arrange-Act-Assert Pattern**
   ```typescript
   it('calculates total correctly', () => {
     // Arrange
     const items = [{ price: 10 }, { price: 20 }]
     
     // Act
     const total = calculateTotal(items)
     
     // Assert
     expect(total).toBe(30)
   })
   ```

4. **Test Edge Cases**
   ```typescript
   describe('validateEmail', () => {
     it('validates correct email')
     it('rejects email without @')
     it('rejects email without domain')
     it('handles null input')
     it('handles empty string')
   })
   ```

### Frontend-Specific Best Practices

1. **Use Semantic Queries**
   ```typescript
   // Good: Semantic queries
   screen.getByRole('button', { name: 'Submit' })
   screen.getByLabelText('Email Address')
   
   // Avoid: Implementation details
   screen.getByClassName('btn-submit')
   ```

2. **Test User Interactions**
   ```typescript
   const user = userEvent.setup()
   await user.type(emailInput, 'test@example.com')
   await user.click(submitButton)
   ```

3. **Mock External Dependencies**
   ```typescript
   vi.mock('../api/client', () => ({
     post: vi.fn(),
     get: vi.fn(),
   }))
   ```

### Backend-Specific Best Practices

1. **Use Fixtures for Test Data**
   ```python
   @pytest.fixture
   def sample_user():
       return {
           "email": "test@example.com",
           "full_name": "Test User"
       }
   ```

2. **Test Database Interactions**
   ```python
   async def test_create_user_saves_to_database(mock_collection):
       await service.create_user(user_data)
       mock_collection.insert_one.assert_called_once()
   ```

3. **Test Error Conditions**
   ```python
   async def test_invalid_credentials_raises_unauthorized():
       with pytest.raises(HTTPException) as exc:
           await auth_service.authenticate_user(invalid_creds)
       assert exc.value.status_code == 401
   ```

## 🔍 Troubleshooting

### Common Issues

#### Frontend

**Issue**: `ReferenceError: vi is not defined`
```typescript
// Solution: Add to test file
import { vi } from 'vitest'
```

**Issue**: Tests failing due to missing DOM APIs
```typescript
// Solution: Add to test setup
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({ matches: false })),
})
```

**Issue**: React component not rendering
```typescript
// Solution: Wrap in proper providers
render(
  <BrowserRouter>
    <AuthProvider>
      <ComponentUnderTest />
    </AuthProvider>
  </BrowserRouter>
)
```

#### Backend

**Issue**: `async def` test not running
```python
# Solution: Add pytest-asyncio marker
@pytest.mark.asyncio
async def test_async_function():
    pass
```

**Issue**: Database connection errors
```python
# Solution: Use mocked database in tests
@pytest.fixture(autouse=True)
def override_get_database(mock_db):
    app.dependency_overrides[get_database] = lambda: mock_db
```

**Issue**: Import errors in tests
```python
# Solution: Add project root to Python path
# Or run tests with: python -m pytest
```

### Debug Mode

#### Frontend
```bash
# Run tests with debug info
npm run test -- --reporter=verbose

# Debug specific test
npm run test -- --reporter=verbose ComponentName.test.tsx
```

#### Backend
```bash
# Run with debug output
pytest -s -vv tests/unit/test_auth_service.py::test_specific_function

# Run with pdb debugger
pytest --pdb tests/unit/test_auth_service.py
```

## 🚦 Pre-commit Hooks

Install pre-commit hooks to run tests automatically:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

The hooks will run:
- Frontend linting and tests
- Backend tests
- Code formatting checks
- Security scans

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure good coverage** (aim for 80%+)
3. **Follow naming conventions**
4. **Update this documentation** if needed
5. **Run full test suite** before submitting PR

Remember: **Good tests are documentation** - they should clearly express what the code is supposed to do.