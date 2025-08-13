# HLRA Setup Guide

Complete setup and installation guide for the Health Lab Report Analyzer (HLRA) project.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Development Tools](#development-tools)
- [Docker Setup](#docker-setup)
- [Troubleshooting](#troubleshooting)
- [Verification](#verification)

## 🖥 System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.15, Ubuntu 18.04 or later
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher  
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 5GB free space
- **Internet**: Required for package installations and MongoDB Atlas

### Recommended Development Environment
- **IDE**: VS Code with Python and TypeScript extensions
- **Terminal**: Modern terminal with UTF-8 support
- **Git**: Latest version
- **Docker**: For containerized development (optional)

## ⚡ Quick Start

For experienced developers who want to get up and running quickly:

```bash
# 1. Clone repository
git clone https://github.com/nikkvijay/Health-Lab-Report-Analyzer.git
cd Health-Lab-Report-Analyzer

# 2. Backend setup
cd HLRA-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your settings
python main.py &

# 3. Frontend setup  
cd ../HLRA-frontend
npm install
cp .env.example .env  # Edit with backend URL
npm run dev

# 4. Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## 🔧 Detailed Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/nikkvijay/Health-Lab-Report-Analyzer.git

# Navigate to project directory
cd Health-Lab-Report-Analyzer

# Verify repository structure
ls -la
```

You should see:
```
HLRA-backend/          # Python FastAPI backend
HLRA-frontend/         # React TypeScript frontend
DEPLOYMENT.md         # Deployment instructions
README.md            # Project documentation
```

### Step 2: Backend Setup

#### Python Environment Setup
```bash
cd HLRA-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Verify Python version
python --version  # Should be 3.11+
```

#### Install Python Dependencies
```bash
# Upgrade pip
pip install --upgrade pip

# Install project dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep fastapi
```

#### Install Tesseract OCR

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-eng

# Verify installation
tesseract --version
```

**macOS:**
```bash
# Using Homebrew
brew install tesseract

# Verify installation
tesseract --version
```

**Windows:**
1. Download from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install to `C:\Program Files\Tesseract-OCR`
3. Add to PATH: `C:\Program Files\Tesseract-OCR`
4. Verify: `tesseract --version`

#### Configure Backend Environment
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env  # or use your preferred editor
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../HLRA-frontend

# Verify Node.js version
node --version  # Should be 18+
npm --version

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env  # Set VITE_API_BASE_URL=http://localhost:8000
```

## 🗄 Database Configuration

### Option 1: MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account
   - Create a new cluster (M0 Sandbox - Free)

2. **Configure Database Access**
   - Go to Database Access
   - Create database user with password
   - Set permissions to "Read and write to any database"

3. **Configure Network Access**
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (for development)
   - In production, restrict to specific IPs

4. **Get Connection String**
   - Go to Clusters → Connect
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password

5. **Update Environment Variables**
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/hlra_db?retryWrites=true&w=majority
   MONGODB_NAME=hlra_db
   ```

### Option 2: Local MongoDB

1. **Install MongoDB**
   ```bash
   # Ubuntu
   sudo apt install mongodb-server
   
   # macOS
   brew install mongodb-community
   
   # Windows - Download from mongodb.com
   ```

2. **Start MongoDB Service**
   ```bash
   # Ubuntu
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   
   # macOS
   brew services start mongodb-community
   ```

3. **Update Environment Variables**
   ```env
   MONGODB_URL=mongodb://localhost:27017/hlra_db
   MONGODB_NAME=hlra_db
   ```

## 🔑 Environment Variables

### Backend Environment (.env)
```env
# Database Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/hlra_db
MONGODB_NAME=hlra_db

# JWT Configuration
SECRET_KEY=generate-secure-32-char-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
DEBUG=true
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# OCR Configuration
TESSERACT_PATH=/usr/bin/tesseract  # Adjust path as needed

# Public App URL (for shared links)
PUBLIC_APP_URL=http://localhost:3000
```

### Frontend Environment (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME="HLRA - Health Lab Results Analysis"
VITE_APP_VERSION="1.0.0"

# Feature Flags (optional)
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_FAMILY_PROFILES=true
VITE_ENABLE_REPORT_SHARING=true

# Public App URL (for shared links)
VITE_PUBLIC_APP_URL=http://localhost:3000
```

### Generate Secure Secret Key
```bash
# Method 1: Using OpenSSL
openssl rand -hex 32

# Method 2: Using Python
python -c "import secrets; print(secrets.token_hex(32))"

# Method 3: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🛠 Development Tools

### VS Code Extensions

#### For Backend Development
- **Python** - Microsoft Python extension
- **Pylance** - Enhanced Python language support
- **Python Docstring Generator** - Auto-generate docstrings
- **autoDocstring** - Generate Python docstrings
- **GitLens** - Git integration

#### For Frontend Development
- **TypeScript Importer** - Auto import TypeScript modules
- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **Tailwind CSS IntelliSense** - Tailwind CSS autocomplete
- **Prettier** - Code formatter
- **ESLint** - JavaScript/TypeScript linting

### Git Configuration
```bash
# Set up Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Optional: Set up Git aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
```

## 🐳 Docker Setup (Optional)

For containerized development environment:

### Backend Dockerfile
Already included at `HLRA-backend/Dockerfile`

### Docker Compose Setup
Create `docker-compose.dev.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./HLRA-backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017/hlra_db
      - DEBUG=true
    depends_on:
      - mongo
    volumes:
      - ./HLRA-backend:/app
      - ./HLRA-backend/uploads:/app/uploads

  frontend:
    build: ./HLRA-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
    volumes:
      - ./HLRA-frontend:/app
      - /app/node_modules

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=hlra_db
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Run with Docker
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues

**Issue: ModuleNotFoundError**
```bash
# Solution: Ensure virtual environment is activated
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

**Issue: MongoDB Connection Failed**
```bash
# Solution: Check MongoDB status and connection string
# For local MongoDB:
sudo systemctl status mongodb

# For MongoDB Atlas:
# Verify connection string, username, password, and IP whitelist
```

**Issue: Tesseract OCR Not Found**
```bash
# Solution: Install Tesseract and update PATH
# Ubuntu:
sudo apt install tesseract-ocr
which tesseract

# Update .env with correct TESSERACT_PATH
```

**Issue: Port Already in Use**
```bash
# Solution: Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9
# Or change API_PORT in .env
```

#### Frontend Issues

**Issue: Node Version Incompatible**
```bash
# Solution: Update Node.js to version 18+
# Using nvm:
nvm install 18
nvm use 18
```

**Issue: npm install Fails**
```bash
# Solution: Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue: API Connection Failed**
```bash
# Solution: Check backend is running and CORS settings
curl http://localhost:8000/health
# Verify VITE_API_BASE_URL in frontend .env
```

#### Permission Issues

**Issue: Upload Directory Permission Denied**
```bash
# Solution: Create uploads directory with proper permissions
mkdir -p HLRA-backend/uploads
chmod 755 HLRA-backend/uploads
```

### Debug Mode

#### Backend Debug Mode
```bash
# Enable debug mode in .env
DEBUG=true

# Run with verbose logging
python main.py --log-level debug
```

#### Frontend Debug Mode
```bash
# Enable verbose logging
VITE_LOG_LEVEL=debug npm run dev

# Open browser dev tools for detailed logs
```

### Health Checks

#### Backend Health Check
```bash
curl http://localhost:8000/health
# Expected response: {"status": "healthy"}
```

#### Database Health Check
```bash
# Test database connection
python -c "
import asyncio
from app.database.connection import connect_to_mongo
asyncio.run(connect_to_mongo())
print('Database connection successful')
"
```

#### Frontend Health Check
```bash
# Check if frontend serves correctly
curl http://localhost:5173
# Should return HTML content
```

## ✅ Verification

### Step-by-step Verification

1. **Backend Verification**
   ```bash
   cd HLRA-backend
   source venv/bin/activate
   python main.py
   # Should see: "Server started at http://0.0.0.0:8000"
   ```

2. **API Documentation Access**
   - Open browser: http://localhost:8000/docs
   - Should see Swagger UI with API documentation

3. **Frontend Verification**
   ```bash
   cd HLRA-frontend
   npm run dev
   # Should see: "Local: http://localhost:5173"
   ```

4. **Application Access**
   - Open browser: http://localhost:5173
   - Should see HLRA application login page

5. **File Upload Test**
   - Register new user account
   - Try uploading a sample PDF/image file
   - Verify file appears in uploads directory

6. **Database Verification**
   - Check MongoDB for created collections
   - Verify user data is stored correctly

### Performance Verification

#### Backend Performance
```bash
# Test API response time
time curl http://localhost:8000/api/v1/health

# Load test (install apache bench first)
ab -n 100 -c 10 http://localhost:8000/api/v1/health
```

#### Frontend Performance
```bash
# Build production version
npm run build

# Check bundle size
ls -lh dist/assets/

# Test production build
npm run preview
```

### Security Verification

1. **Environment Variables**: Ensure no secrets in code
2. **CORS Configuration**: Verify appropriate origins
3. **File Upload Security**: Test file type restrictions
4. **Authentication**: Verify JWT token handling

## 🎉 Next Steps

After successful setup:

1. **Read the Documentation**
   - Main README.md for project overview
   - API.md for API documentation
   - CONTRIBUTING.md for development guidelines

2. **Explore the Code**
   - Backend: Start with `app/main.py`
   - Frontend: Start with `src/App.tsx`

3. **Run Tests**
   ```bash
   # Backend tests
   cd HLRA-backend && pytest
   
   # Frontend tests  
   cd HLRA-frontend && npm test
   ```

4. **Try the Features**
   - User registration/login
   - Family profile creation
   - File upload and OCR processing
   - Health data visualization

5. **Development Workflow**
   - Make changes to code
   - Test locally
   - Follow contribution guidelines for PRs

## 📞 Getting Help

If you encounter issues during setup:

1. **Check logs** for error messages
2. **Review troubleshooting** section above
3. **Search existing issues** on GitHub
4. **Create new issue** with detailed error information
5. **Ask for help** in project discussions

Include in help requests:
- Operating system and version
- Python/Node.js versions
- Full error messages
- Steps taken before error occurred

---

You're now ready to start developing with HLRA! 🚀