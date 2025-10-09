# 🚨 URGENT: Manual Render Configuration Required

## Issue
Render is ignoring the `render.yaml` file and still running `npm run dev` instead of the production commands.

## 🔧 IMMEDIATE SOLUTION: Manual Dashboard Configuration

### Step 1: Access Your Render Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your `qr-access-request-api` service
3. Click on **Settings**

### Step 2: Update Build & Deploy Settings
**IMPORTANT: Set these values manually in the dashboard:**

- **Build Command**: `npm install --production`
- **Start Command**: `node server.js`
- **Root Directory**: `server`

### Step 3: Environment Variables
Add these environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://your-frontend-url.vercel.app

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_ENABLED=true

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# URLs
BASE_URL=https://your-service-name.onrender.com
FRONTEND_URL=https://your-frontend-url.vercel.app
CLIENT_URL=https://your-frontend-url.vercel.app
```

### Step 4: Save and Deploy
1. Click **Save Changes**
2. Trigger a **Manual Deploy**
3. Monitor the build logs

## ✅ Expected Result
After manual configuration, you should see:
- Build: `npm install --production` ✅
- Start: `node server.js` ✅
- No more "nodemon not found" errors ✅

## 🔍 Why This Happens
- Render dashboard settings override YAML files
- Previous manual configurations are cached
- YAML files are sometimes ignored if manual settings exist

## 📋 Verification Checklist
- [ ] Build command set to `npm install --production`
- [ ] Start command set to `node server.js`
- [ ] Root directory set to `server`
- [ ] All environment variables added
- [ ] Manual deploy triggered
- [ ] Build logs show correct commands
- [ ] Service starts successfully

## 🎯 Next Steps After Success
Once working, you can use the `render.yaml` file for future deployments by:
1. Clearing all manual settings in dashboard
2. Committing the YAML file to your repository
3. Render will then use the YAML configuration