# HLRA Deployment Guide

## Overview
This guide covers deploying the HLRA application with:
- **Backend**: Render (FastAPI/Python)
- **Frontend**: Vercel (React/TypeScript)

## Backend Deployment (Render)

### Prerequisites
- Render account
- MongoDB Atlas database (recommended)
- GitHub repository

### Steps

1. **Push your code to GitHub** (if not already done)

2. **Create a new Web Service on Render**:
   - Connect your GitHub repository
   - Select the `HLRA-backend` directory as the root
   - Choose "Docker" as the environment (uses the provided Dockerfile)
   - Or use the render.yaml configuration file

3. **Set Environment Variables in Render Dashboard**:
   ```
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/hlra_db
   SECRET_KEY=generate-a-secure-32-char-secret-key
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ALGORITHM=HS256
   CORS_ORIGINS=https://your-frontend-domain.vercel.app
   ENVIRONMENT=production
   PORT=10000
   ```

4. **Deploy**: Render will automatically build and deploy your application

### Files Created:
- `render.yaml` - Render configuration
- `Dockerfile` - Container configuration
- `requirements.txt` - Updated with versions and production dependencies
- `.env.example` - Environment variables template

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- GitHub repository
- Backend deployed and URL available

### Steps

1. **Create a new project on Vercel**:
   - Import your GitHub repository
   - Select the `HLRA-frontend` directory as the root
   - Framework preset should auto-detect as "Vite"

2. **Set Environment Variables in Vercel Dashboard**:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.render.com
   ```

3. **Deploy**: Vercel will automatically build and deploy your application

### Files Created:
- `vercel.json` - Vercel configuration with SPA routing
- `.env.example` - Environment variables template for frontend

## Post-Deployment

### 1. Update CORS Settings
After frontend deployment, update the backend CORS_ORIGINS environment variable with your actual Vercel URL:
```
CORS_ORIGINS=https://your-actual-app.vercel.app
```

### 2. Database Setup
- Ensure MongoDB Atlas is configured and accessible
- Update DATABASE_URL with your actual connection string
- Consider setting up database indexes for better performance

### 3. Security
- Generate a secure SECRET_KEY using: `openssl rand -hex 32`
- Enable proper HTTPS redirects
- Configure appropriate file upload limits

### 4. Monitoring
- Set up health checks on Render
- Monitor application logs
- Set up error tracking (optional)

## Environment Variables Summary

### Backend (Render)
```env
DATABASE_URL=mongodb+srv://...
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
CORS_ORIGINS=https://your-app.vercel.app
ENVIRONMENT=production
PORT=10000
```

### Frontend (Vercel)
```env
VITE_API_BASE_URL=https://your-backend.render.com
```

## Troubleshooting

### Backend Issues
- Check Render logs for startup errors
- Verify MongoDB connection string
- Ensure all required environment variables are set
- Check CORS configuration if frontend can't connect

### Frontend Issues
- Verify VITE_API_BASE_URL points to correct backend
- Check browser network tab for API call errors
- Ensure backend CORS allows frontend domain

### Common Issues
- **CORS errors**: Update backend CORS_ORIGINS with exact frontend URL
- **API not found**: Verify frontend VITE_API_BASE_URL is correct
- **Database connection**: Check MongoDB Atlas IP whitelist and credentials
- **File uploads**: Ensure backend has write permissions to uploads directory