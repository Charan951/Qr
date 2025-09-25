# 🚀 Production Deployment Guide - QR Access Request System

## 📋 Overview
This guide will help you deploy the QR Access Request System with all email features working correctly in production.

## 🔧 Required Environment Variables for Production

### 🖥️ Backend (Render) Environment Variables

Set these in your Render dashboard under your service's Environment tab:

```bash
# Application Environment
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://qr:123@cluster0.ofifu7s.mongodb.net/access-request-db?retryWrites=true&w=majority&appName=Cluster0

# Security
JWT_SECRET=your-super-secure-jwt-secret-here

# Production URLs (UPDATE THESE!)
BASE_URL=https://qr-nk38.onrender.com
CLIENT_URL=https://your-frontend-domain.vercel.app
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=speshway2017@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_USER=speshway2017@gmail.com
EMAIL_PASS=your-gmail-app-password

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=speshway-dev-bucket1
```

### 🌐 Frontend (Vercel) Environment Variables

Set these in your Vercel dashboard under your project's Settings > Environment Variables:

```bash
REACT_APP_API_URL=https://qr-nk38.onrender.com/api
REACT_APP_BASE_URL=https://qr-nk38.onrender.com
```

## 🔑 Critical Changes Needed

### 1. Update Production URLs
Replace these localhost URLs with your actual production domains:

- `BASE_URL`: Your Render backend URL (e.g., `https://qr-nk38.onrender.com`)
- `CLIENT_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
- `FRONTEND_URL`: Same as CLIENT_URL

### 2. Gmail App Password Setup
For email functionality to work in production:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
3. Use this app password for `SMTP_PASS` and `EMAIL_PASS`

## 📧 Email Features That Will Work in Production

After proper setup, these email notifications will work:

1. **New Access Request Notifications** → Sent to HR/Admin users
2. **Request Status Updates** → Sent to requesters
3. **HR Approval Success Notifications** → Sent to requesters when HR approves
4. **Request Rejection Notifications** → Sent to requesters when rejected
5. **Email Action Links** → Approve/Reject buttons in emails work correctly

## 🚀 Deployment Steps

### Step 1: Update Render Environment Variables
1. Go to your Render dashboard
2. Select your backend service
3. Go to Environment tab
4. Update/add all the environment variables listed above
5. **Important**: Update the URLs to use your production domains

### Step 2: Update Vercel Environment Variables
1. Go to your Vercel dashboard
2. Select your frontend project
3. Go to Settings > Environment Variables
4. Update the API URLs to point to your Render backend

### Step 3: Deploy
1. Commit any local changes to your repository
2. Push to your main branch
3. Both Render and Vercel will auto-deploy

### Step 4: Verify Deployment
Run the verification script locally with production environment variables:

```bash
# In your server directory
node verifyProduction.js
```

## 🧪 Testing Production Email Functionality

### Test Scenario 1: New Request Notification
1. Submit a new access request through the frontend
2. Check that HR/Admin users receive email notifications
3. Verify email contains correct information and links

### Test Scenario 2: Email Action Links
1. Click "Approve" or "Reject" buttons in the email
2. Verify the action is processed correctly
3. Check that success/rejection notifications are sent

### Test Scenario 3: HR Approval Success
1. Have HR approve a request
2. Verify the requester receives the success notification
3. Check that the email contains correct details

## 🔍 Troubleshooting

### Email Not Sending
- Verify Gmail app password is correct
- Check SMTP configuration in Render environment variables
- Ensure `NODE_ENV=production` is set

### Email Links Not Working
- Verify `BASE_URL` points to your Render domain
- Check CORS configuration in server.js
- Ensure email action route is accessible

### Database Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions

## 📊 Environment Variable Checklist

### ✅ Backend (Render) - 16 Variables Required
- [ ] NODE_ENV
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] BASE_URL (production domain)
- [ ] CLIENT_URL (frontend domain)
- [ ] FRONTEND_URL (frontend domain)
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_SECURE
- [ ] SMTP_USER
- [ ] SMTP_PASS (Gmail app password)
- [ ] EMAIL_USER
- [ ] EMAIL_PASS (Gmail app password)
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] AWS_REGION
- [ ] AWS_S3_BUCKET_NAME

### ✅ Frontend (Vercel) - 2 Variables Required
- [ ] REACT_APP_API_URL
- [ ] REACT_APP_BASE_URL

## 🎯 Success Indicators

After successful deployment, you should see:
- ✅ All environment variables set correctly
- ✅ Production URLs configured (no localhost)
- ✅ Email service connected and verified
- ✅ Database connection successful
- ✅ Email notifications working for all scenarios
- ✅ Email action links functional

## 🆘 Support

If you encounter issues:
1. Run the verification script to identify problems
2. Check Render and Vercel logs for errors
3. Verify all environment variables are set correctly
4. Test email configuration with a simple test email

## 📝 Notes

- The system is already configured for production with proper CORS, error handling, and logging
- All email templates and notification functions are implemented
- The catch-all route fix prevents interference with email action responses
- Enhanced logging helps with production debugging