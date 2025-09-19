# QR Access Request System - Deployment Guide

## 🚀 Backend Deployment to Render

### Prerequisites
1. Create a [Render](https://render.com) account
2. Have your MongoDB Atlas connection string ready
3. Set up AWS S3 bucket for image storage
4. Configure email service (Gmail with app password)

### Step 1: Deploy Backend to Render

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `server` folder as the root directory

2. **Configure Build Settings**
   - **Name**: `qr-access-request-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Set Environment Variables**
   In Render dashboard, add these environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://qr:123@cluster0.ofifu7s.mongodb.net/access-request-db?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=your-bucket-name
   CLIENT_URL=https://your-vercel-app.vercel.app
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your Render URL: `https://your-app-name.onrender.com`

### Step 2: Update Backend URLs
After deployment, update the following files with your actual Render URL:

1. **server/.env** - Replace `https://your-render-app.onrender.com` with your actual URL
2. **server/render.yaml** - Already configured for automatic deployment

---

## 🌐 Frontend Deployment to Vercel

### Prerequisites
1. Create a [Vercel](https://vercel.com) account
2. Have your Render backend URL ready

### Step 1: Update Frontend Configuration

1. **Update Environment Variables**
   Replace `https://your-render-app.onrender.com` in these files with your actual Render URL:
   - `client/.env`
   - `client/vercel.json`

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from client directory**
   ```bash
   cd client
   vercel --prod
   ```

#### Option B: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory** to `client`
5. **Framework Preset**: Create React App
6. **Build Command**: `npm run build`
7. **Output Directory**: `build`
8. Add environment variables:
   ```
   REACT_APP_API_BASE_URL=https://your-render-app.onrender.com
   GENERATE_SOURCEMAP=false
   CI=false
   ```
9. Click "Deploy"

### Step 3: Update CORS Configuration
After getting your Vercel URL, update the backend CORS configuration:

1. **Update server/.env**
   ```
   CLIENT_URL=https://your-vercel-app.vercel.app
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

2. **Redeploy backend** on Render to apply CORS changes

---

## 🔧 Post-Deployment Configuration

### 1. Test API Endpoints
Visit your Render URL + `/api/health` to verify backend is running:
```
https://your-render-app.onrender.com/api/health
```

### 2. Test Frontend
Visit your Vercel URL to verify frontend is working:
```
https://your-vercel-app.vercel.app
```

### 3. Test Full Flow
1. Create an access request
2. Verify email notifications work
3. Test admin/HR login and approval process
4. Check image upload functionality

---

## 🐛 Common Issues & Solutions

### Backend Issues
1. **MongoDB Connection Error**
   - Verify MongoDB URI is correct
   - Check IP whitelist in MongoDB Atlas

2. **CORS Errors**
   - Ensure CLIENT_URL matches your Vercel domain exactly
   - Redeploy backend after updating CORS settings

3. **Email Not Sending**
   - Use Gmail app password, not regular password
   - Enable 2FA and generate app password

### Frontend Issues
1. **API Calls Failing**
   - Verify REACT_APP_API_BASE_URL is correct
   - Check browser network tab for exact error

2. **Build Failures**
   - Set CI=false to ignore warnings as errors
   - Check for any TypeScript/linting errors

---

## 📝 Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket
CLIENT_URL=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend (Vercel)
```
REACT_APP_API_BASE_URL=https://your-render-app.onrender.com
GENERATE_SOURCEMAP=false
CI=false
```

---

## 🔄 Redeployment Process

### Backend Updates
1. Push changes to GitHub
2. Render will auto-deploy from connected repository
3. Or manually trigger deployment in Render dashboard

### Frontend Updates
1. Push changes to GitHub
2. Vercel will auto-deploy from connected repository
3. Or run `vercel --prod` from client directory

---

## 📞 Support

If you encounter issues:
1. Check Render/Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test API endpoints individually
4. Check browser console for frontend errors

Remember to replace all placeholder URLs with your actual deployment URLs!