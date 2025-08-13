# Health Lab Report Analyzer (HLRA)

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![Frontend Deploy](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-brightgreen.svg)](https://health-lab-report-analyzer.vercel.app)
[![Backend Deploy](https://img.shields.io/badge/Backend-Live%20on%20Render-brightgreen.svg)](https://health-lab-report-analyzer.onrender.com)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger%20UI-orange.svg)](https://health-lab-report-analyzer.onrender.com/docs)

A comprehensive web application for analyzing and managing health laboratory reports with OCR capabilities, family profile management, and data visualization.

**🚀 Live Demo:** [https://health-lab-report-analyzer.vercel.app](https://health-lab-report-analyzer.vercel.app)  
**📚 API Docs:** [https://health-lab-report-analyzer.onrender.com/docs](https://health-lab-report-analyzer.onrender.com/docs)

[Features](#features) • [Live Demo](#live-demo) • [Installation](#installation) • [API Documentation](#api-documentation) • [Contributing](#contributing)

</div>

## 📋 Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Live Demo

### Frontend Application
**URL:** [https://health-lab-report-analyzer.vercel.app](https://health-lab-report-analyzer.vercel.app)

Experience the full HLRA application with:
- User registration and authentication
- Family profile management
- Health report upload and OCR processing
- Data visualization and trends
- Report sharing capabilities

### Backend API
**URL:** [https://health-lab-report-analyzer.onrender.com](https://health-lab-report-analyzer.onrender.com)  
**Interactive Docs:** [https://health-lab-report-analyzer.onrender.com/docs](https://health-lab-report-analyzer.onrender.com/docs)

Explore the complete API documentation with:
- All available endpoints
- Request/response schemas
- Interactive testing interface
- Authentication examples

### Quick Test
1. **Visit:** [https://health-lab-report-analyzer.vercel.app](https://health-lab-report-analyzer.vercel.app)
2. **Register** a new account or login
3. **Create** a family profile
4. **Upload** a sample health report (PDF/image)
5. **View** the processed data and insights

> **Note:** The backend may take a few seconds to wake up on first request (Render free tier)

## ✨ Features

### Core Features
- **📄 Document Processing**: Upload and analyze PDF, JPG, PNG health reports using OCR
- **👥 Family Profile Management**: Create and manage multiple family member profiles
- **📊 Data Visualization**: Interactive charts and trends for health metrics
- **🔗 Report Sharing**: Secure sharing of health reports with customizable access
- **🔔 Notifications**: Real-time notifications for report updates and sharing
- **🌙 Dark/Light Mode**: Toggle between dark and light themes
- **📱 Responsive Design**: Mobile-friendly interface

### Technical Features
- **🔐 JWT Authentication**: Secure user authentication and authorization
- **📁 File Upload**: Drag-and-drop file upload with progress tracking
- **🔍 OCR Integration**: Extract text from medical documents using Tesseract
- **💾 MongoDB Integration**: Robust data storage and retrieval
- **⚡ Real-time Updates**: Live data synchronization
- **🎯 Type Safety**: Full TypeScript implementation
- **🧪 Comprehensive Testing**: Unit and integration tests

## 🛠 Technology Stack

### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with python-jose
- **OCR**: Tesseract with pytesseract
- **PDF Processing**: PyPDF2, pdfplumber, pdf2image
- **Testing**: pytest, pytest-asyncio

### Frontend
- **Framework**: React 19+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: TanStack Query, React Context
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Testing**: Vitest, React Testing Library

### DevOps & Deployment
- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel
- **Containerization**: Docker
- **CI/CD**: GitHub Actions (optional)

## 📁 Project Structure

```
Health-Lab-Report-Analyzer/
├── HLRA-backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/              # API endpoints
│   │   ├── core/                # Core configurations
│   │   ├── database/            # Database connection
│   │   ├── models/              # Pydantic models
│   │   ├── schemas/             # Request/Response schemas
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utility functions
│   ├── tests/                   # Backend tests
│   ├── uploads/                 # File upload directory
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile              # Container configuration
│   └── render.yaml             # Render deployment config
├── HLRA-frontend/               # React Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API services
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
│   ├── package.json            # Node dependencies
│   ├── vercel.json            # Vercel deployment config
│   └── vite.config.ts         # Vite configuration
├── DEPLOYMENT.md               # Deployment guide
└── README.md                   # This file
```

## 🚀 Installation

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **MongoDB** (local or Atlas)
- **Tesseract OCR** (for document processing)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nikkvijay/Health-Lab-Report-Analyzer.git
   cd Health-Lab-Report-Analyzer/HLRA-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Install Tesseract OCR**
   - **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
   - **macOS**: `brew install tesseract`
   - **Windows**: Download from [GitHub releases](https://github.com/UB-Mannheim/tesseract/wiki)

6. **Run the backend**
   ```bash
   python main.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../HLRA-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   ```

### Access the Application

#### 🌐 Live Production (Deployed)
- **Frontend**: https://health-lab-report-analyzer.vercel.app
- **Backend API**: https://health-lab-report-analyzer.onrender.com
- **API Documentation**: https://health-lab-report-analyzer.onrender.com/docs

#### 💻 Local Development
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📖 Usage

### Getting Started

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Family Profiles**: Add family members for organized health tracking
3. **Upload Reports**: Drag and drop health reports (PDF, JPG, PNG)
4. **View Analysis**: Review extracted data and health metrics
5. **Share Reports**: Generate shareable links for specific reports
6. **Track Trends**: Monitor health metrics over time with interactive charts

### File Upload Guidelines

- **Supported formats**: PDF, JPG, JPEG, PNG
- **Maximum file size**: 10MB
- **Best practices**: 
  - Ensure clear, high-resolution images
  - PDF files should have readable text or clear scanned images
  - Avoid blurry or low-contrast documents

### Family Profile Management

- Create separate profiles for each family member
- Assign reports to specific profiles
- View consolidated health data per profile
- Share profile-specific reports

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/register    # User registration
POST /api/v1/auth/login       # User login
POST /api/v1/auth/refresh     # Refresh access token
```

### File Upload Endpoints
```
POST /api/v1/upload/file      # Upload health report
GET  /api/v1/upload/files     # List user files
GET  /api/v1/upload/file/{id} # Get specific file
```

### Family Profile Endpoints
```
GET    /api/v1/family-profiles     # List profiles
POST   /api/v1/family-profiles     # Create profile
PUT    /api/v1/family-profiles/{id} # Update profile
DELETE /api/v1/family-profiles/{id} # Delete profile
```

### Data Extraction Endpoints
```
POST /api/v1/extraction/process   # Process uploaded file
GET  /api/v1/extraction/results   # Get extraction results
```

### Report Sharing Endpoints
```
POST /api/v1/shared-reports       # Create shareable link
GET  /api/v1/shared-reports/{id}  # Access shared report
```

For complete API documentation, visit `/docs` endpoint when running the backend.

## 🚀 Deployment

### 🌐 Live Deployment

**Frontend (Vercel):** [https://health-lab-report-analyzer.vercel.app](https://health-lab-report-analyzer.vercel.app)  
**Backend (Render):** [https://health-lab-report-analyzer.onrender.com](https://health-lab-report-analyzer.onrender.com)  
**API Documentation:** [https://health-lab-report-analyzer.onrender.com/docs](https://health-lab-report-analyzer.onrender.com/docs)

### Quick Deploy Guide

#### Backend (Render) ✅ DEPLOYED
1. ✅ Push code to GitHub
2. ✅ Create new Web Service on Render
3. ✅ Connect repository, select `HLRA-backend` directory
4. ✅ Set environment variables
5. ✅ Deploy successful

**Current Status:** Live at [https://health-lab-report-analyzer.onrender.com](https://health-lab-report-analyzer.onrender.com)

#### Frontend (Vercel) ✅ DEPLOYED
1. ✅ Create new project on Vercel
2. ✅ Import repository, select `HLRA-frontend` directory
3. ✅ Set `VITE_API_BASE_URL` environment variable
4. ✅ Deploy successful

**Current Status:** Live at [https://health-lab-report-analyzer.vercel.app](https://health-lab-report-analyzer.vercel.app)

### Environment Configuration
- **Backend CORS:** Updated to allow frontend domain
- **Frontend API URL:** Points to Render backend
- **Database:** MongoDB Atlas integration active

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🧪 Testing

### Backend Tests
```bash
cd HLRA-backend
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd HLRA-frontend
npm test
npm run test:ui    # UI mode
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual component/function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full application flow testing (planned)

## 📊 Performance & Monitoring

### Backend Performance
- **Async/await**: Non-blocking operations
- **Connection pooling**: Efficient database connections
- **File streaming**: Memory-efficient file handling
- **Caching**: Redis integration (planned)

### Frontend Performance
- **Code splitting**: Lazy loading of components
- **Image optimization**: WebP format support
- **Bundle optimization**: Tree shaking and minification
- **Caching strategies**: Service worker integration (planned)

## 🔒 Security Features

### Backend Security
- **JWT Authentication**: Secure token-based auth
- **Password hashing**: bcrypt implementation
- **CORS configuration**: Restricted origins
- **File validation**: Type and size restrictions
- **SQL injection prevention**: Parameterized queries

### Frontend Security
- **XSS protection**: Content sanitization
- **CSRF protection**: Token validation
- **Secure storage**: httpOnly cookies for tokens
- **Input validation**: Zod schema validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- **Backend**: Follow PEP 8, use black formatter
- **Frontend**: ESLint + Prettier configuration
- **Commits**: Conventional commit messages
- **Documentation**: Update relevant docs with changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** - Modern, fast web framework for APIs
- **React** - User interface library
- **Tesseract OCR** - Open source OCR engine
- **MongoDB** - Document database
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Low-level UI primitives

## 📞 Support

- **Documentation**: Check the docs in `/docs` folders
- **Issues**: [GitHub Issues](https://github.com/nikkvijay/Health-Lab-Report-Analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nikkvijay/Health-Lab-Report-Analyzer/discussions)

---

<div align="center">
Made with ❤️ by the HLRA Team
</div>