# 🚀 Production Environment Variables - Quick Reference

## 📋 Copy-Paste Ready Environment Variables

### 🖥️ Render (Backend) Environment Variables
Copy these to your Render dashboard:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://qr:123@cluster0.ofifu7s.mongodb.net/access-request-db?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secure-jwt-secret-here
BASE_URL=https://qr-nk38.onrender.com
CLIENT_URL=https://your-frontend-domain.vercel.app
FRONTEND_URL=https://your-frontend-domain.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=speshway2017@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_USER=speshway2017@gmail.com
EMAIL_PASS=your-gmail-app-password
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=speshway-dev-bucket1
```

### 🌐 Vercel (Frontend) Environment Variables
Copy these to your Vercel dashboard:

```
REACT_APP_API_URL=https://qr-nk38.onrender.com/api
REACT_APP_BASE_URL=https://qr-nk38.onrender.com
```

## ⚠️ IMPORTANT: Update These Values

1. **Replace `your-frontend-domain.vercel.app`** with your actual Vercel domain
2. **Replace `your-gmail-app-password`** with your actual Gmail app password
3. **Replace `your-aws-access-key`** and **`your-aws-secret-key`** with your actual AWS credentials
4. **Replace `your-super-secure-jwt-secret-here`** with a strong JWT secret

## 🔑 Gmail App Password Setup

1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate app password for "Mail"
4. Use this password for `SMTP_PASS` and `EMAIL_PASS`

## 🎯 Quick Deployment Checklist

- [ ] Set all Render environment variables
- [ ] Set all Vercel environment variables  
- [ ] Update production URLs (remove localhost)
- [ ] Generate Gmail app password
- [ ] Deploy both services
- [ ] Test email functionality

## 🧪 Test After Deployment

1. Submit a new access request
2. Check HR receives email notification
3. Click approve/reject buttons in email
4. Verify success notifications are sent

## 📞 Support

If emails don't work after deployment:
1. Check Render logs for SMTP errors
2. Verify Gmail app password is correct
3. Ensure all URLs point to production domains
4. Run verification script: `node verifyProduction.js`