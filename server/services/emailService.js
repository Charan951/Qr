const nodemailer = require('nodemailer');

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send access request approval/rejection notification
const sendAccessRequestNotification = async (userEmail, userName, status, approverRole, approverName) => {
  try {
    const transporter = createTransporter();
    
    const subject = `Access Request ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const statusText = status === 'approved' ? 'approved' : 'rejected';
    const statusColor = status === 'approved' ? '#4CAF50' : '#f44336';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Access Request Update</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">Dear ${userName},</p>
            
            <p style="font-size: 16px; color: #333;">
              Your access request has been <strong style="color: ${statusColor};">${statusText}</strong> 
              by ${approverRole}: <strong>${approverName}</strong>.
            </p>
            
            <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0;">Status: ${status.toUpperCase()}</h3>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you have any questions, please contact the ${approverRole.toLowerCase()} department.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              This is an automated notification from the Access Request Management System.
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to admin/HR about their action
const sendApproverNotification = async (approverEmail, approverName, userName, status, requestDetails) => {
  try {
    const transporter = createTransporter();
    
    const subject = `Access Request ${status === 'approved' ? 'Approved' : 'Rejected'} - Confirmation`;
    const statusText = status === 'approved' ? 'approved' : 'rejected';
    const statusColor = status === 'approved' ? '#4CAF50' : '#f44336';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Action Confirmation</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">Dear ${approverName},</p>
            
            <p style="font-size: 16px; color: #333;">
              You have successfully <strong style="color: ${statusColor};">${statusText}</strong> 
              the access request for <strong>${userName}</strong>.
            </p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Request Details:</h4>
              <p style="margin: 5px 0; color: #666;"><strong>User:</strong> ${userName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> <span style="color: ${statusColor};">${status.toUpperCase()} by ${approverName}</span></p>
              <p style="margin: 5px 0; color: #666;"><strong>Action Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              The user has been notified about this decision via email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              This is an automated confirmation from the Access Request Management System.
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: approverEmail,
      subject: subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Approver notification sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending approver notification:', error);
    return { success: false, error: error.message };
  }
};

// Send new access request notification to HR and Admin with approve/reject options
const sendNewAccessRequestNotification = async (recipientEmail, recipientName, recipientRole, requestData) => {
  try {
    const transporter = createTransporter();
    
    const subject = `New Access Request - Action Required`;
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    // Generate secure tokens for approve/reject actions
    const approveToken = Buffer.from(JSON.stringify({
      requestId: requestData._id,
      action: 'approve',
      role: recipientRole,
      email: recipientEmail,
      timestamp: Date.now()
    })).toString('base64');
    
    const rejectToken = Buffer.from(JSON.stringify({
      requestId: requestData._id,
      action: 'reject',
      role: recipientRole,
      email: recipientEmail,
      timestamp: Date.now()
    })).toString('base64');
    
    const approveUrl = `${baseUrl}/api/requests/email-action?token=${approveToken}`;
    const rejectUrl = `${baseUrl}/api/requests/email-action?token=${rejectToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">New Access Request - Action Required</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">Dear ${recipientName},</p>
            
            <p style="font-size: 16px; color: #333;">
              A new access request has been submitted and requires your attention.
            </p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Request Details:</h4>
              <p style="margin: 5px 0; color: #666;"><strong>Name:</strong> ${requestData.fullName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${requestData.email}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${requestData.phoneNumber || 'Not provided'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Purpose:</strong> ${requestData.purposeOfAccess}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Whom to Meet:</strong> ${requestData.whomToMeet}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Submitted:</strong> ${new Date(requestData.submittedDate).toLocaleString()}</p>
              ${requestData.referenceName ? `<p style="margin: 5px 0; color: #666;"><strong>Reference:</strong> ${requestData.referenceName} (${requestData.referencePhoneNumber})</p>` : ''}
              ${requestData.trainingName ? `<p style="margin: 5px 0; color: #666;"><strong>Training:</strong> ${requestData.trainingName}</p>` : ''}
              ${requestData.companyName ? `<p style="margin: 5px 0; color: #666;"><strong>Company:</strong> ${requestData.companyName}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                <strong>Take Action:</strong>
              </p>
              
              <div style="display: inline-block; margin: 0 10px;">
                <a href="${approveUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  ✓ APPROVE
                </a>
              </div>
              
              <div style="display: inline-block; margin: 0 10px;">
                <a href="${rejectUrl}" 
                   style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  ✗ REJECT
                </a>
              </div>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2; font-size: 14px;">
                <strong>Note:</strong> You can also log into the dashboard to review and take action on this request.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              This is an automated notification from the Access Request Management System.
            </p>
          </div>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`New request notification sent to ${recipientRole}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Error sending new request notification to ${recipientRole}:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAccessRequestNotification,
  sendApproverNotification,
  sendNewAccessRequestNotification,
};