# 🧪 HLRA Testing Quick Reference

## 🚀 Running Tests

### All Tests
```bash
./run-tests.sh                    # Run complete test suite
```

### Frontend Tests
```bash
cd HLRA-frontend
npm run test                      # Watch mode
npm run test:run                  # Single run
npm run test:ui                   # Visual UI
npm run test:coverage             # With coverage
```

### Backend Tests
```bash
cd HLRA-backend
pytest                            # All tests
pytest -m unit                    # Unit tests only
pytest -m integration             # Integration tests only
pytest --cov=app                  # With coverage
pytest -x                         # Stop on first failure
```

## 📝 Writing Tests

### Frontend Component Test Template
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from '../ComponentName'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    const mockHandler = vi.fn()
    
    render(<ComponentName onAction={mockHandler} />)
    
    await user.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

### Backend Service Test Template
```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_service_function_success(mock_db, sample_data):
    """Test successful operation"""
    # Arrange
    service = ServiceClass(mock_db)
    mock_db.collection.find_one.return_value = sample_data
    
    # Act
    result = await service.function(input_data)
    
    # Assert
    assert result.field == expected_value
    mock_db.collection.find_one.assert_called_once()
```

### Backend API Test Template
```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_api_endpoint(async_client):
    """Test API endpoint"""
    # Arrange
    payload = {"field": "value"}
    
    # Act
    response = await async_client.post("/api/endpoint", json=payload)
    
    # Assert
    assert response.status_code == 200
    assert response.json()["field"] == "expected_value"
```

## 🔧 Common Patterns

### Frontend Mocking
```typescript
// Mock React Router
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock Context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    login: vi.fn(),
    isLoading: false,
  })
}))

// Mock API calls
vi.mock('../api/client', () => ({
  post: vi.fn().mockResolvedValue({ data: mockResponse })
}))
```

### Backend Mocking
```python
# Mock database
@pytest.fixture
def mock_collection():
    collection = AsyncMock()
    collection.find_one.return_value = None
    return collection

# Mock external services
with patch('app.services.email_service.send_email') as mock_send:
    mock_send.return_value = True
    # Test code
```

## 📊 Coverage Commands
```bash
# Frontend coverage
cd HLRA-frontend && npm run test:coverage
# View: coverage/index.html

# Backend coverage
cd HLRA-backend && pytest --cov=app --cov-report=html
# View: htmlcov/index.html
```

## 🐛 Debugging
```bash
# Frontend debug
npm run test -- --reporter=verbose ComponentName.test.tsx

# Backend debug
pytest -s -vv tests/path/to/test.py::test_function
pytest --pdb tests/path/to/test.py  # With debugger
```

## 📋 Test Markers
```python
@pytest.mark.unit          # Unit test
@pytest.mark.integration   # Integration test
@pytest.mark.slow          # Slow test
@pytest.mark.asyncio       # Async test
```

## 🔍 Test Queries (Frontend)
```typescript
// Preferred queries (by accessibility)
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email Address')
screen.getByPlaceholderText('Enter email')
screen.getByText('Welcome')
screen.getByDisplayValue('current value')

// Query variants
getBy*     // Throws if not found
queryBy*   // Returns null if not found
findBy*    // Async, waits for element

// Multiple elements
getAllBy*, queryAllBy*, findAllBy*
```

## ✅ Best Practices Checklist

### Frontend
- [ ] Use semantic queries (getByRole, getByLabelText)
- [ ] Test user interactions with userEvent
- [ ] Mock external dependencies
- [ ] Test loading and error states
- [ ] Wrap components in required providers

### Backend
- [ ] Use descriptive test names
- [ ] Mock database operations
- [ ] Test both success and error cases
- [ ] Use fixtures for test data
- [ ] Mark async tests with @pytest.mark.asyncio

### General
- [ ] Follow Arrange-Act-Assert pattern
- [ ] Test edge cases and error conditions
- [ ] Maintain good test coverage (80%+)
- [ ] Keep tests independent and isolated
- [ ] Write tests before implementing features (TDD)

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| `vi is not defined` | Import `{ vi } from 'vitest'` |
| React component won't render | Wrap in BrowserRouter/providers |
| Async test not running | Add `@pytest.mark.asyncio` |
| Database connection errors | Use mocked database |
| Import errors in tests | Run with `python -m pytest` |
| Tests passing locally but failing in CI | Check environment differences |

## 📞 Quick Help
- Check `TESTING.md` for detailed guide
- Look at existing tests for patterns
- Run `./run-tests.sh` before committing
- Use `test:ui` for visual feedback
- Check coverage reports regularly