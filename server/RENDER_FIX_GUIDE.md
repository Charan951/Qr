# Render Deployment Fix Guide

## Issue Identified
The build was failing because Render was trying to run `npm run dev` which requires `nodemon` (a dev dependency not available in production).

## Fixes Applied

### 1. Updated render.yaml
- Changed `buildCommand` from `npm ci --only=production` to `npm install --production`
- Changed `startCommand` from `npm start` to `node server.js` (direct command)
- Removed `rootDir: ./server` to avoid path confusion

### 2. Alternative Deployment Methods

#### Option A: Use the updated render.yaml
The main render.yaml file has been fixed and should work now.

#### Option B: Manual Configuration in Render Dashboard
If the YAML file still doesn't work, configure manually in Render:

1. **Build Command**: `npm install --production`
2. **Start Command**: `node server.js`
3. **Root Directory**: `server` (set in dashboard)

#### Option C: Use render-simple.yaml
A simplified configuration file has been created as `render-simple.yaml` with minimal settings.

## Deployment Steps

### Method 1: Re-deploy with Fixed Configuration
1. Commit and push the updated render.yaml
2. In Render dashboard, trigger a new deployment
3. Monitor the build logs

### Method 2: Manual Dashboard Configuration
1. Go to your Render service settings
2. Update Build Command: `npm install --production`
3. Update Start Command: `node server.js`
4. Set Root Directory: `server`
5. Deploy

## Environment Variables to Set in Render Dashboard

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email
SMTP_PASS=your_email_password
EMAIL_ENABLED=true
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_bucket_name
BASE_URL=https://your-service-name.onrender.com
FRONTEND_URL=https://your-frontend-url.vercel.app
CLIENT_URL=https://your-frontend-url.vercel.app
```

## Troubleshooting

### If build still fails:
1. Check that you're deploying from the correct branch
2. Verify the Root Directory is set to `server` in Render dashboard
3. Make sure all environment variables are set
4. Check the build logs for specific error messages

### Common Issues:
- **Path issues**: Ensure Root Directory is set to `server`
- **Missing dependencies**: Use `npm install --production` not `npm ci`
- **Environment variables**: Make sure all required vars are set in Render dashboard

## Success Indicators
- Build completes without errors
- Service starts successfully
- Health check at `/api/health` returns 200 OK
- No "nodemon not found" errors in logs

Your deployment should now work correctly!