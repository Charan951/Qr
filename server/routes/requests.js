const express = require('express');
const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');
const Message = require('../models/Message');
const { formatDateTimeIST, sendAccessRequestNotification, sendActionNotificationToStaff, sendNewAccessRequestNotification, sendHRApprovalSuccessNotification } = require('../services/emailService');
const router = express.Router();

// @route   GET /api/requests/email-action
// @desc    Handle email action (approve/reject) from email links
// @access  Public (token-based authentication)
router.get('/email-action', async (req, res) => {
  try {
    // Set response headers early to prevent CORS issues
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Content-Type', 'text/html; charset=utf-8');
    
    const { token } = req.query;
    
    console.log('Email action endpoint accessed:', {
      query: req.query,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress
    });
    
    if (!token) {
      console.log('Email action failed: No token provided');
      res.status(400);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Request - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #f44336; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .footer { margin-top: 30px; font-size: 14px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Invalid Request</h2>
              <p>No token provided in the request.</p>
              <div class="footer">Please use the original email link or contact your administrator.</div>
            </div>
          </body>
        </html>
      `);
    }

    // Decode the token with better error handling
    let tokenData;
    try {
      console.log('Attempting to decode token:', token.substring(0, 20) + '...');
      const decodedString = Buffer.from(token, 'base64').toString('utf8');
      console.log('Decoded string length:', decodedString.length);
      tokenData = JSON.parse(decodedString);
      console.log('Token decoded successfully:', {
        requestId: tokenData.requestId,
        action: tokenData.action,
        role: tokenData.role,
        email: tokenData.email ? tokenData.email.substring(0, 5) + '...' : 'undefined'
      });
    } catch (error) {
      console.error('Token decoding failed:', {
        error: error.message,
        token: token.substring(0, 50) + '...',
        tokenLength: token.length
      });
      res.status(400);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Token - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #f44336; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .footer { margin-top: 30px; font-size: 14px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Invalid Token</h2>
              <p>The token is malformed or corrupted.</p>
              <div class="footer">Please use the original email link or request a new approval email.</div>
            </div>
          </body>
        </html>
      `);
    }

    // Validate token data structure
    const { requestId, action, role, email, timestamp } = tokenData;
    
    if (!requestId || !action || !role || !email || !timestamp) {
      console.log('Token validation failed:', {
        requestId,
        action,
        role,
        email,
        timestamp,
        missingFields: {
          requestId: !requestId,
          action: !action,
          role: !role,
          email: !email,
          timestamp: !timestamp
        }
      });
      res.status(400);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Token - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #f44336; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .footer { margin-top: 30px; font-size: 14px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Invalid Token</h2>
              <p>The token is missing required information or is corrupted.</p>
              <div class="footer">Please use the original email link or request a new approval email.</div>
            </div>
          </body>
        </html>
      `);
    }

    // Validate action type
    if (!['approve', 'reject'].includes(action)) {
      console.log('Invalid action type:', { action, validActions: ['approve', 'reject'] });
      res.status(400);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Action - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #f44336; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .footer { margin-top: 30px; font-size: 14px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Invalid Action</h2>
              <p>The requested action is not valid.</p>
              <div class="footer">Please use the original email link or request a new approval email.</div>
            </div>
          </body>
        </html>
      `);
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (tokenAge > maxAge) {
      console.log('Token expired:', {
        tokenTimestamp: new Date(timestamp),
        currentTime: new Date(),
        ageInHours: (Date.now() - timestamp) / (1000 * 60 * 60)
      });
      res.status(400);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Token Expired - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #ff9800; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .footer { margin-top: 30px; font-size: 14px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>⏰ Token Expired</h2>
              <p>This approval link has expired (valid for 24 hours only).</p>
              <div class="footer">Please request a new approval email from your administrator.</div>
            </div>
          </body>
        </html>
      `);
    }

    // Find the access request with better error handling
    let accessRequest;
    try {
      console.log('Looking up access request:', requestId);
      accessRequest = await AccessRequest.findById(requestId);
    } catch (dbError) {
      console.error('Database error finding access request:', dbError);
      res.status(500);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Server Error - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #f44336; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .footer { margin-top: 30px; font-size: 14px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Server Error</h2>
              <p>Unable to process your request at this time.</p>
              <div class="footer">Please try again later or contact your administrator.</div>
            </div>
          </body>
        </html>
      `);
    }

    if (!accessRequest) {
      console.log('Access request not found:', { requestId });
      res.status(404);
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Request Not Found - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #ff9800; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .footer { margin-top: 30px; font-size: 14px; color: #999; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Request Not Found</h2>
              <p>The access request could not be found or may have been deleted.</p>
              <div class="footer">Please contact your administrator for assistance.</div>
            </div>
          </body>
        </html>
      `);
    }

    console.log('Access request found:', {
      id: accessRequest._id,
      status: accessRequest.status,
      fullName: accessRequest.fullName,
      email: accessRequest.email
    });

    // Check if request is already processed
    if (accessRequest.status !== 'pending') {
      console.log('Request already processed:', {
        requestId,
        currentStatus: accessRequest.status,
        processedBy: accessRequest.approvedBy
      });
      res.status(200).type('html');
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Already Processed - Access Management System</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h2 { color: #ff9800; margin-bottom: 20px; }
              p { color: #666; font-size: 16px; }
              .info-box { margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
              .info-box p { color: #333; margin: 5px 0; }
              .status-approved { color: #4CAF50; font-weight: bold; }
              .status-rejected { color: #f44336; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>✓ Already Processed</h2>
              <p>This request has already been <span class="status-${accessRequest.status}">${accessRequest.status.toUpperCase()}</span>.</p>
              <div class="info-box">
                <p><strong>Processed by:</strong> ${accessRequest.approvedBy || 'Unknown'}</p>
                <p><strong>Date:</strong> ${formatDateTimeIST(accessRequest.approvedAt) || 'Unknown'}</p>
              </div>
            </div>
          </body>
        </html>
      `);
    }

    // Update the request based on action
    console.log('Processing action:', {
      requestId,
      action,
      role,
      email: email.substring(0, 5) + '...'
    });

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: `${role.toUpperCase()} (${email})`,
      approvedAt: new Date()
    };

    try {
      await AccessRequest.findByIdAndUpdate(requestId, updateData);
      console.log('Access request updated successfully:', {
        requestId,
        newStatus: updateData.status,
        processedBy: updateData.approvedBy
      });
    } catch (updateError) {
      console.error('Error updating access request:', {
        error: updateError.message,
        requestId,
        updateData
      });
      return res.status(500).type('html').send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Update Error - Access Management System</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #f44336; margin-bottom: 20px;">Update Error</h2>
              <p style="color: #666; font-size: 16px;">Unable to update the request status.</p>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">Please try again later or contact your administrator.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Send email notifications and create messages (same as HR/Admin dashboard approval)
    try {
      console.log('Starting email notification process...');

      // Send email to the user who made the request
      await sendAccessRequestNotification(
        accessRequest.email,
        accessRequest.fullName,
        action === 'approve' ? 'approved' : 'rejected',
        role.toUpperCase(),
        `Email Action (${email})`,
        accessRequest
      );
      console.log('Notification sent to request user:', accessRequest.email);

      // If HR approved via email, send success notifications to both admin and HR
      if (role.toLowerCase() === 'hr' && action === 'approve') {
        // Send success notification emails to all HR users (including the one who took action)
        const hrUsers = await User.find({ role: 'hr', isActive: true }).select('email username');
        console.log('Found HR users for success notification:', hrUsers.length);
        
        for (const hrUser of hrUsers) {
          if (hrUser.email) {
            const recipientName = hrUser.username || hrUser.email.split('@')[0];
            await sendHRApprovalSuccessNotification(
              hrUser.email,
              recipientName,
              'hr',
              accessRequest.fullName,
              accessRequest.email,
              `Email Action (${email})`,
              accessRequest
            );
            console.log(`HR approval success notification sent to HR: ${hrUser.email}`);
          }
        }

        // Send success notification emails to all Admin users
        const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email username');
        console.log('Found Admin users for success notification:', adminUsers.length);
        
        for (const adminUser of adminUsers) {
          if (adminUser.email) {
            const recipientName = adminUser.username || adminUser.email.split('@')[0];
            await sendHRApprovalSuccessNotification(
              adminUser.email,
              recipientName,
              'admin',
              accessRequest.fullName,
              accessRequest.email,
              `Email Action (${email})`,
              accessRequest
            );
            console.log(`HR approval success notification sent to Admin: ${adminUser.email}`);
          }
        }
      } else {
        // For other cases (admin actions or HR rejections), send regular action notifications
        // Send notification emails to all HR users (except the one who took action)
        const hrUsers = await User.find({ role: 'hr', isActive: true }).select('email username');
        console.log('Found HR users:', hrUsers.length);
        
        for (const hrUser of hrUsers) {
          if (hrUser.email && hrUser.email !== email) {
            const recipientName = hrUser.username || hrUser.email.split('@')[0];
            await sendActionNotificationToStaff(
              hrUser.email,
              recipientName,
              accessRequest.fullName,
              action === 'approve' ? 'approved' : 'rejected',
              `${role.toUpperCase()} (${email})`,
              new Date(),
              {
                email: accessRequest.email,
                purpose: accessRequest.purposeOfAccess,
                whomToMeet: accessRequest.whomToMeet,
                images: accessRequest.images
              }
            );
            console.log(`Action notification sent to HR: ${hrUser.email}`);
          }
        }

        // Send notification emails to all Admin users (except the one who took action)
        const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email username');
        console.log('Found Admin users:', adminUsers.length);
        
        for (const adminUser of adminUsers) {
          if (adminUser.email && adminUser.email !== email) {
            const recipientName = adminUser.username || adminUser.email.split('@')[0];
            await sendActionNotificationToStaff(
              adminUser.email,
              recipientName,
              accessRequest.fullName,
              action === 'approve' ? 'approved' : 'rejected',
              `${role.toUpperCase()} (${email})`,
              new Date(),
              {
                email: accessRequest.email,
                purpose: accessRequest.purposeOfAccess,
                whomToMeet: accessRequest.whomToMeet,
                images: accessRequest.images
              }
            );
            console.log(`Action notification sent to Admin: ${adminUser.email}`);
          }
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
        console.log('Approval message created successfully');
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
        console.log('Rejection message created successfully');
      }

      console.log('Email notifications and messages sent successfully for email action');
    } catch (emailError) {
      console.error('Error sending notifications for email action:', {
        error: emailError.message,
        stack: emailError.stack,
        requestId,
        action
      });
      // Don't fail the request update if email fails - just log it
    }

    // Send success response
    const actionText = action === 'approve' ? 'Approved' : 'Rejected';
    const actionColor = action === 'approve' ? '#4CAF50' : '#f44336';
    const actionIcon = action === 'approve' ? '✓' : '✗';
    const actionBgColor = action === 'approve' ? '#e8f5e8' : '#ffeaea';
    
    console.log('Sending success response for:', {
      requestId,
      action: actionText,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).type('html').send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          }
          
          .icon {
            font-size: 60px;
            color: ${actionColor};
            margin-bottom: 20px;
            display: block;
          }
          
          .title {
            font-size: 32px;
            font-weight: 700;
            color: ${actionColor};
            margin-bottom: 10px;
          }
          
          .subtitle {
            font-size: 18px;
            color: #666;
            margin: 0;
          }
          
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          
          .info-box {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid ${actionColor};
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          
          .info-row:last-child {
            border-bottom: none;
          }
          
          .info-label {
            font-weight: 600;
            color: #333;
          }
          
          .info-value {
            color: #666;
            text-align: right;
            max-width: 60%;
            word-break: break-word;
          }
          
          .footer {
            padding: 30px;
            background: #f8f9fa;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .container {
              margin: 0;
            }
            
            .header, .content, .footer {
              padding: 20px;
            }
            
            .title {
              font-size: 24px;
            }
            
            .info-row {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .info-value {
              text-align: left;
              max-width: 100%;
              margin-top: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="icon">${actionIcon}</span>
            <h1 class="title">Request ${actionText}</h1>
            <p class="subtitle">The access request has been successfully ${action}d</p>
          </div>
          
          <div class="content">
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Request ID:</span>
                <span class="info-value">${requestId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Applicant:</span>
                <span class="info-value">${accessRequest.fullName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${accessRequest.email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Action Taken:</span>
                <span class="info-value">${actionText} by ${role.toUpperCase()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Processed By:</span>
                <span class="info-value">${email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date & Time:</span>
                <span class="info-value">${formatDateTimeIST(new Date())}</span>
              </div>
            </div>
            
            <p style="color: #666; margin-top: 30px;">
              ${action === 'approve' 
                ? 'The applicant has been notified of the approval and can now proceed with their access request.' 
                : 'The applicant has been notified of the rejection. They may submit a new request if needed.'
              }
            </p>
          </div>
          
          <div class="footer">
            <p>Access Management System</p>
            <p>This action was processed via email link on ${formatDateTimeIST(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Email action error:', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    });
    
    res.status(500).type('html').send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Server Error - Access Management System</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #f44336; margin-bottom: 20px;">Server Error</h2>
            <p style="color: #666; font-size: 16px;">An unexpected error occurred while processing your request.</p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">Please try again later or contact your administrator.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// @route   POST /api/requests
// @desc    Submit access request form
// @access  Public
router.post('/', async (req, res) => {
  console.log('=== FORM SUBMISSION REQUEST RECEIVED ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request body:', req.body);
  
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

    console.log('Creating access request with data:', requestData);
    const accessRequest = new AccessRequest(requestData);
    await accessRequest.save();
    console.log('Access request saved successfully with ID:', accessRequest._id);

    // Return the request ID immediately so frontend can upload images
    const responseData = {
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
    };
    
    console.log('Sending response:', responseData);
    res.status(201).json(responseData);
    console.log('Response sent successfully');

    // Send email notifications asynchronously after response is sent
    setImmediate(async () => {
      try {
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