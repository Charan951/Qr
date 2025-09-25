# Production Environment Setup Guide

## Overview
This guide provides the exact environment variables and configuration needed to deploy the QR Access Request System with email functionality to production.

## 🚀 Production Environment Variables

### For Render (Backend) - Required Environment Variables

Set these environment variables in your Render dashboard:

```bash
# Environment
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://qr:123@cluster0.ofifu7s.mongodb.net/access-request-db?retryWrites=true&w=majority&appName=Cluster0

# Security
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Server URLs (CRITICAL for email links)
BASE_URL=https://qr-nk38.onrender.com
CLIENT_URL=https://qr-oj5t.vercel.app
FRONTEND_URL=https://qr-oj5t.vercel.app

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### For Vercel (Frontend) - Required Environment Variables

Set these environment variables in your Vercel dashboard:

```bash
# API Configuration
REACT_APP_API_URL=https://qr-nk38.onrender.com
REACT_APP_BASE_URL=https://qr-nk38.onrender.com
```

## 🔧 Critical Configuration Changes

### 1. Update render.yaml (if needed)
Ensure your `render.yaml` includes all required environment variables:

```yaml
services:
  - type: web
    name: qr-access-request-api
    env: node
    plan: free
    buildCommand: npm ci --only=production
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: BASE_URL
        sync: false
      - key: CLIENT_URL
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: SMTP_HOST
        sync: false
      - key: SMTP_PORT
        sync: false
      - key: SMTP_SECURE
        sync: false
      - key: SMTP_USER
        sync: false
      - key: SMTP_PASS
        sync: false
      - key: EMAIL_USER
        sync: false
      - key: EMAIL_PASS
        sync: false
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: AWS_REGION
        sync: false
      - key: AWS_S3_BUCKET_NAME
        sync: false
```

### 2. Email Service Production Configuration
The email service is already configured to handle production URLs correctly. It will:
- Use `process.env.BASE_URL` if set
- Fall back to production URL if `NODE_ENV=production`
- Generate correct email action links for production

## 📧 Email Features That Will Work in Production

### 1. New Request Notifications
- ✅ Sent to all HR and Admin users when a new request is submitted
- ✅ Includes approve/reject buttons with production URLs

### 2. HR Approval Success Notifications
- ✅ When HR approves a request, both HR and Admin get success emails
- ✅ Includes complete request details and approval information

### 3. Email Action Links
- ✅ Approve/Reject buttons in emails work with production URLs
- ✅ Proper HTML responses for success/error pages
- ✅ CORS configured for email client compatibility

### 4. User Notifications
- ✅ Users get approval/rejection notifications
- ✅ Includes complete request details and status

## 🚀 Deployment Steps

### Step 1: Update Render Environment Variables
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service: `qr-access-request-api`
3. Go to "Environment" tab
4. Add/update all the environment variables listed above
5. Click "Save Changes"

### Step 2: Update Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add/update the React environment variables listed above
5. Redeploy the frontend

### Step 3: Redeploy Both Services
1. **Backend (Render)**: Will auto-redeploy when environment variables are updated
2. **Frontend (Vercel)**: Trigger a new deployment after updating environment variables

### Step 4: Verify Deployment
1. Check that both services are running
2. Submit a test access request
3. Verify email notifications are sent with production URLs
4. Test email action links (approve/reject buttons)

## 🔍 Troubleshooting

### If Email Links Don't Work:
1. Check that `BASE_URL` is set correctly in Render
2. Verify email contains production URLs (not localhost)
3. Check Render logs for email service errors

### If Emails Aren't Sent:
1. Verify SMTP credentials are correct
2. Check that Gmail app password is valid
3. Review Render logs for email sending errors

### If CORS Errors Occur:
1. Ensure `CLIENT_URL` and `FRONTEND_URL` are set correctly
2. Check that production CORS configuration is active

## 📝 Environment Variable Checklist

**Render (Backend) - 16 variables:**
- [ ] NODE_ENV=production
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] BASE_URL=https://qr-nk38.onrender.com
- [ ] CLIENT_URL=https://qr-oj5t.vercel.app
- [ ] FRONTEND_URL=https://qr-oj5t.vercel.app
- [ ] SMTP_HOST=smtp.gmail.com
- [ ] SMTP_PORT=587
- [ ] SMTP_SECURE=false
- [ ] SMTP_USER=speshway2017@gmail.com
- [ ] SMTP_PASS=your-gmail-app-password
- [ ] EMAIL_USER=your-email@gmail.com
- [ ] EMAIL_PASS=your-gmail-app-password
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] AWS_REGION=ap-south-1
- [ ] AWS_S3_BUCKET_NAME=speshway-dev-bucket1

**Vercel (Frontend) - 2 variables:**
- [ ] REACT_APP_API_URL=https://qr-nk38.onrender.com
- [ ] REACT_APP_BASE_URL=https://qr-nk38.onrender.com

## 🎯 Success Indicators

After deployment, you should see:
1. ✅ Email notifications sent with production URLs
2. ✅ Email action links work correctly
3. ✅ HR approval success emails sent to both HR and Admin
4. ✅ No CORS errors in browser console
5. ✅ All email templates render correctly

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Check Vercel deployment logs
3. Verify all environment variables are set correctly
4. Test email functionality with a new access request