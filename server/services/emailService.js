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

module.exports = {
  sendAccessRequestNotification,
  sendApproverNotification,
};