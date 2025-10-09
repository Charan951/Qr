# Render Deployment Guide for QR Access Request Server

## Prerequisites
- GitHub repository with your server code
- Render account (free tier available)
- MongoDB Atlas database (or other cloud MongoDB)
- AWS S3 bucket for file uploads
- Gmail account for email notifications

## Step-by-Step Deployment Instructions

### 1. Prepare Your Repository
1. Ensure your server code is in the `server` directory
2. Commit and push all changes to your GitHub repository
3. Make sure the `render.yaml` file is in the server directory

### 2. Create a New Web Service on Render

1. **Login to Render Dashboard**
   - Go to [render.com](https://render.com)
   - Sign in with your GitHub account

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your server code

3. **Configure Service Settings**
   - **Name**: `qr-access-request-api` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Build Command**: `npm ci --only=production`
   - **Start Command**: `npm start`

### 3. Configure Environment Variables

In the Render dashboard, add these environment variables:

#### Required Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random
```

#### Email Configuration:
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_ENABLED=true
```

#### AWS S3 Configuration:
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

#### URL Configuration (Update after deployment):
```
BASE_URL=https://your-service-name.onrender.com
FRONTEND_URL=https://your-frontend-url.vercel.app
CLIENT_URL=https://your-frontend-url.vercel.app
```

### 4. Deploy the Service

1. **Review Configuration**
   - Double-check all environment variables
   - Ensure build and start commands are correct

2. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Monitor the build logs for any errors

3. **Verify Deployment**
   - Once deployed, visit: `https://your-service-name.onrender.com/api/health`
   - You should see a health check response

### 5. Update Frontend Configuration

After successful deployment, update your frontend to use the new API URL:
- Replace `http://localhost:5000` with `https://your-service-name.onrender.com`

### 6. Configure Custom Domain (Optional)

If you have a custom domain:
1. Go to Settings in your Render service
2. Add your custom domain
3. Configure DNS records as instructed by Render

## Important Notes

### Free Tier Limitations:
- Service spins down after 15 minutes of inactivity
- First request after spin-down may take 30+ seconds
- 750 hours/month limit (sufficient for most projects)

### Security Considerations:
- Use strong, unique JWT secrets
- Keep AWS credentials secure
- Use environment variables for all sensitive data
- Enable CORS only for trusted domains

### Monitoring:
- Check Render dashboard for service health
- Monitor logs for errors
- Set up uptime monitoring if needed

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify package.json dependencies
   - Review build logs for specific errors

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check MongoDB Atlas network access settings
   - Ensure database user has proper permissions

3. **Environment Variable Issues**
   - Double-check all required variables are set
   - Verify no typos in variable names
   - Check for special characters that need escaping

4. **CORS Errors**
   - Update CORS configuration in server.js
   - Add your frontend URL to allowed origins
   - Verify environment variables are set correctly

### Getting Help:
- Check Render documentation: [docs.render.com](https://docs.render.com)
- Review server logs in Render dashboard
- Test API endpoints using tools like Postman

## Post-Deployment Checklist

- [ ] Health check endpoint responds correctly
- [ ] Database connection is working
- [ ] Email notifications are functioning
- [ ] File uploads to S3 are working
- [ ] Frontend can communicate with API
- [ ] All API endpoints are accessible
- [ ] CORS is configured correctly
- [ ] Environment variables are set properly

Your server should now be successfully deployed on Render!