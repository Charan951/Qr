const express = require('express');
const AccessRequest = require('../models/AccessRequest');
const router = express.Router();

// @route   GET /api/requests/email-action
// @desc    Handle email-based approve/reject actions
// @access  Public (secured by token)
router.get('/email-action', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #f44336;">Invalid Request</h2>
            <p>No token provided.</p>
          </body>
        </html>
      `);
    }

    // Decode the token
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (error) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #f44336;">Invalid Token</h2>
            <p>The token is malformed or corrupted.</p>
          </body>
        </html>
      `);
    }

    const { requestId, action, role, email, timestamp } = tokenData;

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (tokenAge > maxAge) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #f44336;">Token Expired</h2>
            <p>This approval/rejection link has expired. Please use the dashboard to take action.</p>
          </body>
        </html>
      `);
    }

    // Find the access request
    const accessRequest = await AccessRequest.findById(requestId);
    if (!accessRequest) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #f44336;">Request Not Found</h2>
            <p>The access request could not be found.</p>
          </body>
        </html>
      `);
    }

    // Check if request is already processed
    if (accessRequest.status !== 'pending') {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #ff9800;">Already Processed</h2>
            <p>This request has already been ${accessRequest.status}.</p>
            <p><strong>Processed by:</strong> ${accessRequest.approvedBy || accessRequest.rejectedBy || 'Unknown'}</p>
            <p><strong>Date:</strong> ${accessRequest.approvedDate || accessRequest.rejectedDate || 'Unknown'}</p>
          </body>
        </html>
      `);
    }

    // Update the request based on action
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      [`${action}dBy`]: `${role.toUpperCase()} (${email})`,
      [`${action}dDate`]: new Date()
    };

    await AccessRequest.findByIdAndUpdate(requestId, updateData);

    // Send email notifications and create messages (same as HR/Admin dashboard approval)
    try {
      const { sendAccessRequestNotification, sendApproverNotification } = require('../services/emailService');
      const User = require('../models/User');
      const Message = require('../models/Message');

      // Send email to the user who made the request
      await sendAccessRequestNotification(
        accessRequest.email,
        accessRequest.fullName,
        action === 'approve' ? 'approved' : 'rejected',
        role.toUpperCase(),
        `Email Action (${email})`,
        accessRequest
      );

      // Send notification emails to all HR users
      const hrUsers = await User.find({ role: 'hr', isActive: true }).select('email username');
      for (const hrUser of hrUsers) {
        if (hrUser.email && hrUser.email !== email) { // Don't send to the person who took action
          await sendApproverNotification(
            hrUser.email,
            hrUser.username || 'HR User',
            accessRequest.fullName,
            action === 'approve' ? 'approved' : 'rejected',
            {
              email: accessRequest.email,
              purpose: accessRequest.purposeOfAccess,
              whomToMeet: accessRequest.whomToMeet,
              images: accessRequest.images,
              actionTakenBy: `${role.toUpperCase()} (${email})`,
              actionDate: new Date()
            }
          );
        }
      }

      // Send notification emails to all Admin users
      const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email username');
      for (const adminUser of adminUsers) {
        if (adminUser.email && adminUser.email !== email) { // Don't send to the person who took action
          await sendApproverNotification(
            adminUser.email,
            adminUser.username || 'Admin User',
            accessRequest.fullName,
            action === 'approve' ? 'approved' : 'rejected',
            {
              email: accessRequest.email,
              purpose: accessRequest.purposeOfAccess,
              whomToMeet: accessRequest.whomToMeet,
              images: accessRequest.images,
              actionTakenBy: `${role.toUpperCase()} (${email})`,
              actionDate: new Date()
            }
          );
        }
      }

      // Create message for both admin and HR to see (same as dashboard approvals)
      if (action === 'approve') {
        await Message.createApprovalMessage({
          userName: accessRequest.fullName,
          userEmail: accessRequest.email,
          approverName: `Email Action (${email})`,
          approverRole: role.toLowerCase(),
          requestId: accessRequest._id,
          userId: accessRequest._id
        });
      } else {
        await Message.createRejectionMessage({
          userName: accessRequest.fullName,
          userEmail: accessRequest.email,
          approverName: `Email Action (${email})`,
          approverRole: role.toLowerCase(),
          requestId: accessRequest._id,
          userId: accessRequest._id,
          reason: 'Rejected via email'
        });
      }

      console.log('Email notifications and messages sent successfully for email action');
    } catch (emailError) {
      console.error('Error sending notifications for email action:', emailError);
      // Don't fail the request update if email fails
    }

    // Send success response
    const actionText = action === 'approve' ? 'Approved' : 'Rejected';
    const actionColor = action === 'approve' ? '#4CAF50' : '#f44336';
    const actionIcon = action === 'approve' ? '✓' : '✗';
    const actionBgColor = action === 'approve' ? '#e8f5e8' : '#ffeaea';
    
    res.send(`
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Request ${actionText} - Access Management System</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
            animation: slideIn 0.6s ease-out;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .header {
            background: ${actionBgColor};
            padding: 40px 30px;
            text-align: center;
            border-bottom: 3px solid ${actionColor};
          }
          
          .icon {
            width: 80px;
            height: 80px;
            background: ${actionColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
            color: white;
            font-weight: bold;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .header h1 {
            color: ${actionColor};
            font-weight: 700;
            margin-bottom: 10px;
            font-size: 28px;
          }
          
          .header p {
            color: #666;
            font-size: 18px;
            font-weight: 400;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .success-message {
            background: #f8f9fa;
            border-left: 4px solid ${actionColor};
            padding: 20px;
            border-radius: 8px;
          }
          
          
          .success-message p {
            font-size: 18px;
            color: #333;
            margin-bottom: 0;
          }
          
          .details-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            border: 1px solid #e9ecef;
          }
          
          .details-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
          }
          
          .details-title::before {
            content: "📋";
            margin-right: 10px;
            font-size: 20px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
          
          .detail-label {
            font-weight: 600;
            color: #555;
            flex: 1;
          }
          
          .detail-value {
            color: #333;
            flex: 2;
            text-align: right;
          }
          
          .notification-info {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            display: flex;
            align-items: center;
          }
          
          .notification-info::before {
            content: "📧";
            margin-right: 10px;
            font-size: 18px;
          }
          
          .notification-info p {
            margin: 0;
            color: #1976d2;
            font-size: 14px;
          }
          
          .auto-close {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #f1f3f4;
            border-radius: 8px;
          }
          
          .auto-close p {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .countdown {
            font-size: 18px;
            font-weight: 600;
            color: ${actionColor};
          }
          
          .close-btn {
            background: ${actionColor};
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.3s ease;
          }
          
          .close-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            100% { transform: scale(1); }
          }
          
          .subtitle {
        <div class="container">
          <div class="header">
            <div class="icon">${actionIcon}</div>
            <h1 class="title">Request ${actionText}</h1>
            <p class="subtitle">Action completed successfully</p>
          </div>
          
          <div class="content">
            <div class="success-message">
              <p>The access request has been successfully ${action}d and all relevant parties have been notified.</p>
            </div>
            
            <div class="details-card">
              <div class="details-title">Request Details</div>
              <div class="detail-row">
                <span class="detail-label">Request ID:</span>
                <span class="detail-value">${requestId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Applicant:</span>
                <span class="detail-value">${accessRequest.fullName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${accessRequest.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Action taken by:</span>
                <span class="detail-value">${role.toUpperCase()} (${email})</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${new Date().toLocaleString()}</span>
              </div>
            </div>
            
            <div class="notification-info">
              <p>Email notifications have been sent to the applicant and all relevant administrators.</p>
            </div>
            
            <div class="auto-close">
              <p>Action completed successfully!</p>
              <div class="countdown" id="countdown">✓</div>
              <button class="close-btn" onclick="closeWindow()">View Details</button>
            </div>
          </div>
          .content {
        
        <script>
          function closeWindow() {
            // Instead of closing, just show completion message
            document.querySelector('.auto-close').innerHTML = 
              '<p style="color: #4CAF50; font-weight: 600;">✓ Action completed successfully!</p><p style="color: #666; font-size: 14px;">The request has been processed and notifications have been sent.</p>';
          }
        </script>
            padding: 40px 30px;
          }
          
          .success-message {
            background: #f8f9fa;
            border-left: 4px solid ${actionColor};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          
          .success-message p {
            font-size: 18px;
            color: #333;
            margin-bottom: 0;
          }
          
          .details-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            border: 1px solid #e9ecef;
          }
          
          .details-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
          }
          
          .details-title::before {
            content: "📋";
            margin-right: 10px;
            font-size: 20px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
          
          .detail-label {
            font-weight: 600;
            color: #555;
            flex: 1;
          }
          
          .detail-value {
            color: #333;
            flex: 2;
            text-align: right;
          }
          
          .notification-info {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            display: flex;
            align-items: center;
          }
          
          .notification-info::before {
            content: "📧";
            margin-right: 10px;
            font-size: 18px;
          }
          
          .notification-info p {
            margin: 0;
            color: #1976d2;
            font-size: 14px;
          }
          
          .auto-close {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #f1f3f4;
            border-radius: 8px;
          }
          
          .auto-close p {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .countdown {
            font-size: 18px;
            font-weight: 600;
            color: ${actionColor};
          }
          
          .close-btn {
            background: ${actionColor};
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.3s ease;
          }
          
          .close-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">${actionIcon}</div>
            <h1 class="title">Request ${actionText}</h1>
            <p class="subtitle">Action completed successfully</p>
          </div>
          
          <div class="content">
            <div class="success-message">
              <p>The access request has been successfully ${action}d and all relevant parties have been notified.</p>
            </div>
            
            <div class="details-card">
              <div class="details-title">Request Details</div>
              <div class="detail-row">
                <span class="detail-label">Request ID:</span>
                <span class="detail-value">${requestId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Applicant:</span>
                <span class="detail-value">${accessRequest.fullName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${accessRequest.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Action taken by:</span>
                <span class="detail-value">${role.toUpperCase()} (${email})</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${new Date().toLocaleString()}</span>
              </div>
            </div>
            
            <div class="notification-info">
              <p>Email notifications have been sent to the applicant and all relevant administrators.</p>
            </div>
            
            <div class="auto-close">
              <p>Action completed successfully!</p>
              <div class="countdown" id="countdown">✓</div>
              <button class="close-btn" onclick="closeWindow()">View Details</button>
            </div>
          </div>
        </div>
        
        <script>
          function closeWindow() {
            // Instead of closing, just show completion message
            document.querySelector('.auto-close').innerHTML = 
              '<p style="color: #4CAF50; font-weight: 600;">✓ Action completed successfully!</p><p style="color: #666; font-size: 14px;">The request has been processed and notifications have been sent.</p>';
          }
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Error processing email action:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #f44336;">Server Error</h2>
          <p>An error occurred while processing your request. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

// @route   POST /api/requests
// @desc    Submit access request form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      purposeOfAccess,
      whomToMeet,
      referenceName,
      referencePhoneNumber,
      trainingName,
      trainerNumber,
      departmentName,
      visitorDescription,
      companyName,
      clientMobileNumber
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !purposeOfAccess || !whomToMeet) {
      return res.status(400).json({ 
        message: 'Please provide all required fields',
        required: ['fullName', 'email', 'purposeOfAccess', 'whomToMeet']
      });
    }

    // Validate conditional fields based on purpose
    if (purposeOfAccess === 'onboarding' && (!referenceName || !referencePhoneNumber)) {
      return res.status(400).json({ 
        message: 'Reference name and phone number are required for onboarding',
        required: ['referenceName', 'referencePhoneNumber']
      });
    }

    if (purposeOfAccess === 'training' && (!trainingName || !trainerNumber || !departmentName)) {
      return res.status(400).json({ 
        message: 'Training name, trainer number, and department name are required for training',
        required: ['trainingName', 'trainerNumber', 'departmentName']
      });
    }

    if (purposeOfAccess === 'assignment' && !departmentName) {
      return res.status(400).json({ 
        message: 'Department name is required for assignment',
        required: ['departmentName']
      });
    }

    if (purposeOfAccess === 'visitor' && !visitorDescription) {
      return res.status(400).json({ 
        message: 'Description is required for visitor',
        required: ['visitorDescription']
      });
    }

    if (purposeOfAccess === 'client' && (!companyName || !clientMobileNumber)) {
      return res.status(400).json({ 
        message: 'Company name and mobile number are required for client',
        required: ['companyName', 'clientMobileNumber']
      });
    }

    if (purposeOfAccess === 'interview' && (!req.body.interviewPosition || !req.body.interviewerName || !req.body.interviewerPhone || !req.body.interviewType)) {
      return res.status(400).json({ 
        message: 'Position, interviewer name, interviewer phone, and interview type are required for interview',
        required: ['interviewPosition', 'interviewerName', 'interviewerPhone', 'interviewType']
      });
    }

    // Create new access request with conditional fields
    const requestData = {
      fullName,
      email,
      phoneNumber,
      purposeOfAccess,
      whomToMeet,
      submittedDate: new Date(),
      submittedTime: new Date().toLocaleTimeString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Add conditional fields based on purpose
    if (purposeOfAccess === 'onboarding') {
      requestData.referenceName = referenceName;
      requestData.referencePhoneNumber = referencePhoneNumber;
    }

    if (purposeOfAccess === 'training') {
      requestData.trainingName = trainingName;
      requestData.trainerNumber = trainerNumber;
      requestData.departmentName = departmentName;
    }

    if (purposeOfAccess === 'assignment') {
      requestData.departmentName = departmentName;
    }

    if (purposeOfAccess === 'visitor') {
      requestData.visitorDescription = visitorDescription;
    }

    if (purposeOfAccess === 'client') {
      requestData.companyName = companyName;
      requestData.clientMobileNumber = clientMobileNumber;
    }

    if (purposeOfAccess === 'interview') {
      requestData.interviewPosition = req.body.interviewPosition;
      requestData.interviewerName = req.body.interviewerName;
      requestData.interviewerPhone = req.body.interviewerPhone;
      requestData.interviewType = req.body.interviewType;
    }

    const accessRequest = new AccessRequest(requestData);
    await accessRequest.save();

    // Send email notifications to HR and Admin users immediately after request creation
    try {
      const { sendNewAccessRequestNotification } = require('../services/emailService');
      const User = require('../models/User');

      // Get all active HR users
      const hrUsers = await User.find({ role: 'hr', isActive: true }).select('email username');
      
      // Get all active Admin users  
      const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email username');

      // Send notifications to all HR users
      for (const hrUser of hrUsers) {
        if (hrUser.email) {
          try {
            await sendNewAccessRequestNotification(
              hrUser.email,
              hrUser.username,
              'HR',
              accessRequest
            );
            console.log(`New request notification sent to HR: ${hrUser.email}`);
          } catch (emailError) {
            console.error(`Failed to send email to HR ${hrUser.email}:`, emailError);
          }
        }
      }

      // Send notifications to all Admin users
      for (const adminUser of adminUsers) {
        if (adminUser.email) {
          try {
            await sendNewAccessRequestNotification(
              adminUser.email,
              adminUser.username,
              'Admin',
              accessRequest
            );
            console.log(`New request notification sent to Admin: ${adminUser.email}`);
          } catch (emailError) {
            console.error(`Failed to send email to Admin ${adminUser.email}:`, emailError);
          }
        }
      }

    } catch (error) {
      console.error('Error sending email notifications after request creation:', error);
      // Don't fail the request creation if email fails
    }

    // Return the request ID immediately so frontend can upload images
    res.status(201).json({
      success: true,
      message: 'Access request submitted successfully',
      requestId: accessRequest._id,
      data: {
        id: accessRequest._id,
        fullName: accessRequest.fullName,
        email: accessRequest.email,
        status: accessRequest.status,
        submittedDate: accessRequest.submittedDate,
        submittedTime: accessRequest.submittedTime
      }
    });

  } catch (error) {
    console.error('Submit request error:', error);
    res.status(500).json({ message: 'Server error while submitting request' });
  }
});

// @route   GET /api/requests/status
// @desc    Check request status by email and request ID
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const { email, id } = req.query;

    if (!email || !id) {
      return res.status(400).json({ 
        message: 'Please provide both email and request ID' 
      });
    }

    // Find the request
    const request = await AccessRequest.findOne({ 
      _id: id, 
      email: email.toLowerCase() 
    });

    if (!request) {
      return res.status(404).json({ 
        message: 'Request not found or email does not match' 
      });
    }

    res.json({
      success: true,
      data: {
        id: request._id,
        fullName: request.fullName,
        email: request.email,
        phoneNumber: request.phoneNumber,
        purposeOfAccess: request.purposeOfAccess,
        whomToMeet: request.whomToMeet,
        referenceName: request.referenceName,
        referencePhoneNumber: request.referencePhoneNumber,
        trainingName: request.trainingName,
        trainerNumber: request.trainerNumber,
        status: request.status,
        submittedDate: request.submittedDate,
        submittedTime: request.submittedTime,
        approvedBy: request.approvedBy,
        approvedAt: request.approvedAt,
        rejectionReason: request.rejectionReason
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ message: 'Server error while checking status' });
  }
});

// @route   GET /api/requests/user/:email
// @desc    Get all requests by user email
// @access  Public
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const requests = await AccessRequest.find({ 
      email: email.toLowerCase() 
    })
    .sort({ submittedDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await AccessRequest.countDocuments({ 
      email: email.toLowerCase() 
    });

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ message: 'Server error while fetching requests' });
  }
});

module.exports = router;