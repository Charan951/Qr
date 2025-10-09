# Deployment Email Troubleshooting Guide

## Overview
This guide helps resolve email sending issues in production/deployment environments for the Access Request Management System.

## Recent Fixes Applied

### 1. Improved Email Service Configuration
- Enhanced `isEmailEnabled()` function to properly handle production environments
- Added better SMTP configuration with deployment-specific options
- Improved error handling and logging for email operations

### 2. Enhanced SMTP Transporter Configuration
```javascript
// Added deployment-friendly options:
- connectionTimeout: 60000 (60 seconds)
- greetingTimeout: 30000 (30 seconds) 
- socketTimeout: 60000 (60 seconds)
- TLS configuration for different environments
- Gmail-specific service configuration
```

### 3. Robust Email Health Check
- Improved `/api/health/email` endpoint
- Fallback to test email sending if SMTP verification fails
- Comprehensive error reporting with environment details

## Testing Email Functionality

### 1. Health Check Endpoint
Test email configuration using the health check endpoint:
```bash
curl https://your-deployment-url.onrender.com/api/health/email
```

Expected response for healthy email service:
```json
{
  "status": "healthy",
  "message": "Email service is working correctly",
  "environment": "production",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": "587",
  "timestamp": "2025-01-09T10:26:11.219Z"
}
```

### 2. Server Logs Analysis
Check deployment logs for these indicators:

**Successful Email Configuration:**
```
Creating email transporter with config: {
  host: 'smtp.gmail.com',
  port: '587',
  secure: 'false',
  hasAuth: true
}
Email health check passed - SMTP connection verified
```

**Email Sending Success:**
```
Sending approver notification to: admin@example.com
Email sent successfully with messageId: <message-id>
```

## Environment Variables Checklist

Ensure these environment variables are properly set in your deployment platform:

### Required Email Variables
```
EMAIL_ENABLED=true
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
# IMPORTANT: Do NOT set SMTP_SECURE=true for port 587 - it causes connection timeouts
# Port 587 uses STARTTLS (secure: false), only port 465 uses SSL (secure: true)
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
```

### Gmail App Password Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security > App Passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password (without spaces) for `EMAIL_PASS` and `SMTP_PASS`

## Common Deployment Issues & Solutions

### Issue 1: "Email configuration invalid"
**Cause:** Missing or incorrect environment variables
**Solution:** 
- Verify all email environment variables are set
- Check for typos in variable names
- Ensure no extra spaces in email credentials

### Issue 2: "SMTP verification failed"
**Cause:** Deployment environment blocking SMTP verification
**Solution:** 
- The system now automatically falls back to test email sending
- Check logs for "test email sent successfully" message
- This is normal behavior in some deployment environments

### Issue 3: "Authentication failed"
**Cause:** Incorrect Gmail app password or 2FA not enabled
**Solution:**
- Regenerate Gmail app password
- Ensure 2-Factor Authentication is enabled
- Remove any spaces from the app password

### Issue 4: "Connection timeout" (ETIMEDOUT)
**Cause:** Incorrect SMTP configuration or network restrictions
**Solution:**
- **CRITICAL FIX:** Ensure `SMTP_SECURE` is NOT set to `true` when using port 587
- Port 587 requires `secure: false` (STARTTLS), not `secure: true` (SSL)
- Increased timeout values are now configured (2 minutes)
- Check deployment platform's network policies
- Verify Gmail app password is correct and 2FA is enabled
- Consider using different SMTP provider if Gmail is blocked

**Common Mistake:** Setting `SMTP_SECURE=true` with `SMTP_PORT=587` causes immediate timeouts

## Debugging Steps

### 1. Enable Debug Logging
The system now includes comprehensive logging. Check deployment logs for:
- Email configuration loading
- SMTP connection attempts
- Email sending results
- Error details with codes and responses

### 2. Test Email Sending
Use the admin panel to approve/reject a request and monitor logs for:
```
Preparing to send 3 email notifications
Email operation 1: fulfilled with value: {...}
Email operation 2: fulfilled with value: {...}
Email operation 3: fulfilled with value: {...}
```

### 3. Manual Email Test
Access the health check endpoint to trigger a test email:
```bash
curl -X GET https://your-deployment-url.onrender.com/api/health/email
```

## Production Deployment Checklist

- [ ] All email environment variables are set correctly
- [ ] Gmail app password is generated and configured
- [ ] Health check endpoint returns "healthy" status
- [ ] Test email sending through admin approval/rejection
- [ ] Check server logs for successful email operations
- [ ] Verify emails are received in recipient inboxes

## Support

If issues persist after following this guide:
1. Check deployment platform documentation for SMTP restrictions
2. Consider using alternative SMTP providers (SendGrid, Mailgun, etc.)
3. Review server logs for specific error messages
4. Test with different email providers to isolate Gmail-specific issues

## Files Modified
- `server/services/emailService.js` - Enhanced email configuration and error handling
- `server/server.js` - Email health check endpoint (already existed)
- `server/routes/admin.js` - Added debugging logs for email operations

Last Updated: January 9, 2025