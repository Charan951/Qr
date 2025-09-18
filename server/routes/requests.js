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
        `Email Action (${email})`
      );

      // Send notification emails to all HR users
      const hrUsers = await User.find({ role: 'hr', isActive: true }).select('email username');
      for (const hrUser of hrUsers) {
        if (hrUser.email) {
          await sendApproverNotification(
            hrUser.email,
            `Email Action (${email})`,
            accessRequest.fullName,
            action === 'approve' ? 'approved' : 'rejected',
            {
              email: accessRequest.email,
              purpose: accessRequest.purposeOfAccess,
              whomToMeet: accessRequest.whomToMeet
            }
          );
        }
      }

      // Send notification emails to all Admin users
      const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email username');
      for (const adminUser of adminUsers) {
        if (adminUser.email) {
          await sendApproverNotification(
            adminUser.email,
            `Email Action (${email})`,
            accessRequest.fullName,
            action === 'approve' ? 'approved' : 'rejected',
            {
              email: accessRequest.email,
              purpose: accessRequest.purposeOfAccess,
              whomToMeet: accessRequest.whomToMeet
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
    
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${actionColor};">Request ${actionText}</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 18px;">The access request has been successfully ${action}d.</p>
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Request ID:</strong> ${requestId}</p>
                <p><strong>Applicant:</strong> ${accessRequest.fullName}</p>
                <p><strong>Email:</strong> ${accessRequest.email}</p>
                <p><strong>Action taken by:</strong> ${role.toUpperCase()} (${email})</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                The applicant will be notified of this decision via email.
              </p>
            </div>
          </div>
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

    // Send email notifications to HR and Admin users
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
      console.error('Error sending email notifications:', error);
      // Don't fail the request submission if email fails
    }

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