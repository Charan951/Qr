# Deployment Guide

This guide explains how to deploy the QR Access Request Management System with the backend on Render and frontend on Vercel.

## Backend Deployment (Render)

### Prerequisites
1. Create a [Render](https://render.com) account
2. Set up a MongoDB Atlas database
3. Configure AWS S3 bucket for file uploads

### Steps
1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the root directory

2. **Configure Service**
   - Name: `qr-access-backend`
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`

3. **Environment Variables**
   Set the following environment variables in Render:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-super-secret-jwt-key-here
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-s3-bucket-name
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://your-app.onrender.com`)

## Frontend Deployment (Vercel)

### Prerequisites
1. Create a [Vercel](https://vercel.com) account
2. Have your backend deployed and URL ready

### Steps
1. **Connect Repository**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Select the `client` folder as root directory

2. **Configure Build Settings**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Environment Variables**
   Set the following environment variable in Vercel:
   ```
   REACT_APP_API_BASE_URL=https://your-render-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at `https://your-app.vercel.app`

## Post-Deployment Configuration

### Update CORS Settings
1. Update the backend CORS configuration in `server/server.js`
2. Replace `https://your-vercel-app.vercel.app` with your actual Vercel URL
3. Redeploy the backend

### Update Frontend API URL
1. Update `.env.production` with your actual Render backend URL
2. Redeploy the frontend

## Environment Files

### Backend (.env)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend (.env.production)
```
REACT_APP_API_BASE_URL=https://your-render-backend.onrender.com
REACT_APP_ENV=production
REACT_APP_DEBUG=false
GENERATE_SOURCEMAP=false
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure frontend URL is added to backend CORS configuration
2. **Environment Variables**: Double-check all environment variables are set correctly
3. **Database Connection**: Verify MongoDB URI and network access settings
4. **File Uploads**: Ensure AWS S3 credentials and bucket configuration are correct

### Health Check
- Backend health check: `https://your-render-backend.onrender.com/api/health`
- Frontend should load without errors

## Monitoring
- Render provides logs and metrics for the backend
- Vercel provides analytics and performance metrics for the frontend
- Monitor both services for any deployment issues