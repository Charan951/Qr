# Production Email Links Fix

## Issue
Email approval/rejection links are not working in production because they point to `localhost:5000` instead of the production server URL.

## Root Cause
The `BASE_URL` environment variable is not configured in the production environment, causing the system to fall back to the default `http://localhost:5000`.

## Solution

### 1. Set BASE_URL Environment Variable in Render

In your Render dashboard for the backend service:

1. Go to your service settings
2. Navigate to "Environment" tab
3. Add the following environment variable:
   ```
   BASE_URL=https://qr-nk38.onrender.com
   ```
4. Save and redeploy the service

### 2. Verify Configuration

After setting the environment variable, the email links will be generated as:
- Approve: `https://qr-nk38.onrender.com/api/requests/email-action?token=...`
- Reject: `https://qr-nk38.onrender.com/api/requests/email-action?token=...`

### 3. Test the Fix

1. Submit a new access request through the frontend
2. Check the email notification received by HR/Admin
3. Click the "APPROVE" or "REJECT" buttons in the email
4. Verify the action is processed successfully

## Files Modified
- `server/.env` - Updated BASE_URL to correct production URL
- `client/vercel.json` - Updated REACT_APP_API_BASE_URL to match
- `server/.env.example` - Added BASE_URL documentation
- `DEPLOYMENT_GUIDE.md` - Added BASE_URL to environment variables list

## Technical Details
The fix is in `server/services/emailService.js` line 309:
```javascript
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
```

This line now uses the production URL when BASE_URL is properly configured.