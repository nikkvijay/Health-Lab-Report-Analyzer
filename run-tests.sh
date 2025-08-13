#!/bin/bash

# HLRA Test Runner Script
# This script runs all tests for the HLRA project

set -e  # Exit on any error

echo "🧪 HLRA Test Suite Runner"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_section() {
    echo -e "\n${YELLOW}📋 $1${NC}"
    echo "----------------------------------------"
}

# Check if we're in the right directory
if [ ! -d "HLRA-frontend" ] || [ ! -d "HLRA-backend" ]; then
    print_error "Please run this script from the HLRA project root directory"
    exit 1
fi

# Frontend Tests
print_section "Frontend Tests"

cd HLRA-frontend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Installing frontend dependencies..."
    npm install
fi

# Run linting
print_status "Running ESLint..."
npm run lint || {
    print_error "Frontend linting failed"
    exit 1
}

# Run type checking
print_status "Running TypeScript type checking..."
npx tsc --noEmit || {
    print_error "TypeScript type checking failed"
    exit 1
}

# Run tests
print_status "Running frontend tests..."
npm run test:run || {
    print_error "Frontend tests failed"
    exit 1
}

# Build check
print_status "Testing frontend build..."
npm run build || {
    print_error "Frontend build failed"
    exit 1
}

cd ..

# Backend Tests
print_section "Backend Tests"

cd HLRA-backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
print_status "Installing backend dependencies..."
pip install -r requirements.txt

# Check if pytest-cov is available for coverage
pip list | grep pytest-cov > /dev/null || {
    print_warning "Installing pytest-cov for coverage reporting..."
    pip install pytest-cov
}

# Run tests
print_status "Running backend tests..."
python -m pytest tests/ -v --cov=app --cov-report=term-missing --cov-report=html || {
    print_error "Backend tests failed"
    deactivate
    exit 1
}

deactivate
cd ..

# Summary
print_section "Test Summary"
print_status "All tests passed successfully!"

echo -e "\n${GREEN}🎉 Test suite completed successfully!${NC}"
echo ""
echo "Coverage reports:"
echo "  • Frontend: Check browser dev tools for Vitest UI"
echo "  • Backend: ./HLRA-backend/htmlcov/index.html"
echo ""
echo "Next steps:"
echo "  1. Review test coverage reports"
echo "  2. Add more tests for uncovered code"
echo "  3. Set up pre-commit hooks"
echo "  4. Configure CI/CD pipeline"