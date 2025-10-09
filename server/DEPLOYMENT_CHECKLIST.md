# Quick Deployment Checklist for Render

## Pre-Deployment
- [ ] Code committed and pushed to GitHub
- [ ] Environment variables ready (see .env.production)
- [ ] MongoDB Atlas database accessible
- [ ] AWS S3 bucket configured
- [ ] Gmail app password generated

## Render Setup
- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set Root Directory to `server`
- [ ] Configure build command: `npm ci --only=production`
- [ ] Configure start command: `npm start`

## Environment Variables (Copy from .env.production)
- [ ] NODE_ENV=production
- [ ] PORT=10000
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] EMAIL_USER & EMAIL_PASS
- [ ] SMTP configuration
- [ ] AWS credentials
- [ ] URL configuration (update after deployment)

## Post-Deployment
- [ ] Test health endpoint: `/api/health`
- [ ] Update frontend API URL
- [ ] Test all API endpoints
- [ ] Verify email notifications
- [ ] Test file uploads

## Your Render Service URL
After deployment, your API will be available at:
`https://[your-service-name].onrender.com`

Remember to update this URL in your frontend configuration!