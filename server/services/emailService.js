const nodemailer = require('nodemailer');

// Helper function to format date and time in IST
const formatDateTimeIST = (date) => {
  const istDate = new Date(date);
  return istDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send access request approval/rejection notification
const sendAccessRequestNotification = async (userEmail, userName, status, approverRole, approverName, requestData = null) => {
  try {
    const transporter = createTransporter();
    
    const subject = `Access Request ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const statusText = status === 'approved' ? 'approved' : 'rejected';
    const statusColor = status === 'approved' ? '#4CAF50' : '#f44336';
    
    // Add uploaded images section if images exist and requestData is provided
    let imagesHtml = '';
    if (requestData && requestData.images && requestData.images.length > 0) {
      console.log('Email Service - Processing images for approval notification');
      imagesHtml = `
        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h4 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📷</span> Your Uploaded Images (${requestData.images.length})
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">`;
      
      requestData.images.forEach((imageUrl, index) => {
        const fullImageUrl = imageUrl;
        imagesHtml += `
          <div style="text-align: center; background-color: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <img src="${fullImageUrl}" alt="Request Image ${index + 1}" style="max-width: 100%; max-height: 200px; border-radius: 4px; object-fit: cover; display: block; margin: 0 auto;" />
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Image ${index + 1}</p>
          </div>`;
      });
      
      imagesHtml += `
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #666; text-align: center;">
            These were the images you submitted with your request
          </p>
        </div>`;
    }
    
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
            
            ${imagesHtml}
            
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
    
    // Add uploaded images section if images exist in requestDetails
    let imagesHtml = '';
    if (requestDetails && requestDetails.images && requestDetails.images.length > 0) {
      console.log('Email Service - Processing images for approver notification');
      imagesHtml = `
        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h4 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📷</span> Request Images (${requestDetails.images.length})
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">`;
      
      requestDetails.images.forEach((imageUrl, index) => {
        const fullImageUrl = imageUrl;
        imagesHtml += `
          <div style="text-align: center; background-color: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <img src="${fullImageUrl}" alt="Request Image ${index + 1}" style="max-width: 100%; max-height: 200px; border-radius: 4px; object-fit: cover; display: block; margin: 0 auto;" />
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Image ${index + 1}</p>
          </div>`;
      });
      
      imagesHtml += `
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #666; text-align: center;">
            Images submitted with this request
          </p>
        </div>`;
    }
    
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
              <p style="margin: 5px 0; color: #666;"><strong>Action Date:</strong> ${formatDateTimeIST(new Date())}</p>
            </div>
            
            ${imagesHtml}
            
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

// Send notification to HR/Admin about actions taken by others
const sendActionNotificationToStaff = async (recipientEmail, recipientName, userName, status, actionTakenBy, actionDate, requestDetails) => {
  try {
    const transporter = createTransporter();
    
    const subject = `Access Request ${status === 'approved' ? 'Approved' : 'Rejected'} - Notification`;
    const statusText = status === 'approved' ? 'approved' : 'rejected';
    const statusColor = status === 'approved' ? '#4CAF50' : '#f44336';
    const actionIcon = status === 'approved' ? '✅' : '❌';
    
    // Add uploaded images section if images exist in requestDetails
    let imagesHtml = '';
    if (requestDetails && requestDetails.images && requestDetails.images.length > 0) {
      console.log('Email Service - Processing images for staff notification');
      imagesHtml = `
        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h4 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📷</span> Request Images (${requestDetails.images.length})
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">`;
      
      requestDetails.images.forEach((imageUrl, index) => {
        const fullImageUrl = imageUrl;
        imagesHtml += `
          <div style="text-align: center; background-color: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <img src="${fullImageUrl}" alt="Request Image ${index + 1}" style="max-width: 100%; max-height: 200px; border-radius: 4px; object-fit: cover; display: block; margin: 0 auto;" />
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Image ${index + 1}</p>
          </div>`;
      });
      
      imagesHtml += `
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #666; text-align: center;">
            Images submitted with this request
          </p>
        </div>`;
    }
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">${actionIcon} Access Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">Dear ${recipientName},</p>
            
            <p style="font-size: 16px; color: #333;">
              An access request for <strong>${userName}</strong> has been <strong style="color: ${statusColor};">${statusText}</strong> 
              by <strong>${actionTakenBy}</strong>.
            </p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Request Details:</h4>
              <p style="margin: 5px 0; color: #666;"><strong>User:</strong> ${userName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${requestDetails?.email || 'N/A'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Purpose:</strong> ${requestDetails?.purpose || 'N/A'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Whom to Meet:</strong> ${requestDetails?.whomToMeet || 'N/A'}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> <span style="color: ${statusColor};">${status.toUpperCase()}</span></p>
              <p style="margin: 5px 0; color: #666;"><strong>Action Taken By:</strong> ${actionTakenBy}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Action Date:</strong> ${formatDateTimeIST(actionDate)}</p>
            </div>
            
            ${imagesHtml}
            
            <p style="font-size: 14px; color: #666;">
              The user has been notified about this decision via email.
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
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Staff action notification sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending staff action notification:', error);
    return { success: false, error: error.message };
  }
};

// Send new access request notification to HR and Admin with approve/reject options
const sendNewAccessRequestNotification = async (recipientEmail, recipientName, recipientRole, requestData) => {
  try {
    const transporter = createTransporter();
    
    const subject = `New Access Request - Action Required`;
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    // Log BASE_URL for debugging
    console.log('EmailService - Using BASE_URL:', baseUrl);
    console.log('EmailService - Environment BASE_URL:', process.env.BASE_URL);
    
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
    
    const approveUrl = `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/email-action?token=${approveToken}`;
    const rejectUrl = `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/email-action?token=${rejectToken}`;
    
    // Log generated URLs for debugging
    console.log('EmailService - Generated approve URL:', approveUrl);
    console.log('EmailService - Generated reject URL:', rejectUrl);
    
    // Build comprehensive request details section
    let requestDetailsHtml = `
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Request Details:</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <p style="margin: 5px 0; color: #666;"><strong>Name:</strong> ${requestData.fullName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> <a href="mailto:${requestData.email}" style="color: #1976d2;">${requestData.email}</a></p>
            <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${requestData.phoneNumber || 'Not provided'}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Purpose:</strong> ${requestData.purposeOfAccess}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Whom to Meet:</strong> ${requestData.whomToMeet}</p>
          </div>
          
          <div>
            <p style="margin: 5px 0; color: #666;"><strong>Submitted Date:</strong> ${formatDateTimeIST(requestData.submittedDate)}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Submitted Time:</strong> ${requestData.submittedTime || formatDateTimeIST(requestData.submittedDate)}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> <span style="background-color: #ff9800; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">PENDING</span></p>
          </div>
        </div>`;

    // Add reference details if available
    if (requestData.referenceName) {
      requestDetailsHtml += `
        <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #555;">Reference Information:</h5>
          <p style="margin: 5px 0; color: #666;"><strong>Reference Name:</strong> ${requestData.referenceName}</p>
          ${requestData.referencePhoneNumber ? `<p style="margin: 5px 0; color: #666;"><strong>Reference Phone:</strong> ${requestData.referencePhoneNumber}</p>` : ''}
        </div>`;
    }

    // Add training details if available
    if (requestData.trainingName) {
      requestDetailsHtml += `
        <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #555;">Training Information:</h5>
          <p style="margin: 5px 0; color: #666;"><strong>Training Name:</strong> ${requestData.trainingName}</p>
          ${requestData.trainerNumber ? `<p style="margin: 5px 0; color: #666;"><strong>Trainer Number:</strong> ${requestData.trainerNumber}</p>` : ''}
          ${requestData.departmentName ? `<p style="margin: 5px 0; color: #666;"><strong>Department:</strong> ${requestData.departmentName}</p>` : ''}
        </div>`;
    }

    // Add company details if available
    if (requestData.companyName) {
      requestDetailsHtml += `
        <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #555;">Company Information:</h5>
          <p style="margin: 5px 0; color: #666;"><strong>Company Name:</strong> ${requestData.companyName}</p>
          ${requestData.clientMobileNumber ? `<p style="margin: 5px 0; color: #666;"><strong>Client Mobile:</strong> ${requestData.clientMobileNumber}</p>` : ''}
        </div>`;
    }

    // Add interview details if available
    if (requestData.interviewPosition) {
      requestDetailsHtml += `
        <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #555;">Interview Information:</h5>
          <p style="margin: 5px 0; color: #666;"><strong>Position:</strong> ${requestData.interviewPosition}</p>
          ${requestData.interviewerName ? `<p style="margin: 5px 0; color: #666;"><strong>Interviewer:</strong> ${requestData.interviewerName}</p>` : ''}
          ${requestData.interviewerPhone ? `<p style="margin: 5px 0; color: #666;"><strong>Interviewer Phone:</strong> ${requestData.interviewerPhone}</p>` : ''}
          ${requestData.interviewType ? `<p style="margin: 5px 0; color: #666;"><strong>Interview Type:</strong> ${requestData.interviewType}</p>` : ''}
        </div>`;
    }

    // Add visitor description if available
    if (requestData.visitorDescription) {
      requestDetailsHtml += `
        <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
          <h5 style="margin: 0 0 10px 0; color: #555;">Visitor Description:</h5>
          <p style="margin: 5px 0; color: #666;">${requestData.visitorDescription}</p>
        </div>`;
    }

    requestDetailsHtml += `</div>`;

    // Add uploaded images section if images exist
    let imagesHtml = '';
    console.log('Email Service - Request Data Images:', requestData.images);
    console.log('Email Service - Images Array Length:', requestData.images ? requestData.images.length : 0);
    
    if (requestData.images && requestData.images.length > 0) {
      console.log('Email Service - Processing images for email display');
      imagesHtml = `
        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h4 style="margin: 0 0 15px 0; color: #333; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📷</span> Uploaded Images (${requestData.images.length})
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">`;
      
      requestData.images.forEach((imageUrl, index) => {
        console.log(`Email Service - Processing image ${index + 1}:`, imageUrl);
        // Images are stored as full S3 URLs, so use them directly
        const fullImageUrl = imageUrl;
        imagesHtml += `
          <div style="text-align: center; background-color: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <img src="${fullImageUrl}" alt="Request Image ${index + 1}" style="max-width: 100%; max-height: 200px; border-radius: 4px; object-fit: cover; display: block; margin: 0 auto;" />
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Image ${index + 1}</p>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #999; word-break: break-all;">${fullImageUrl}</p>
          </div>`;
      });
      
      imagesHtml += `
          </div>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #666; text-align: center;">
            Click on images to view in full size
          </p>
        </div>`;
    } else {
      console.log('Email Service - No images found in request data');
      // Add a debug section to show that no images were found
      imagesHtml = `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>📷 Images:</strong> No images were uploaded with this request.
          </p>
        </div>`;
    }
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">New Access Request - Action Required</h2>
            <div style="width: 60px; height: 3px; background-color: #2196f3; margin: 10px auto;"></div>
          </div>
          
          <div style="background-color: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${recipientName},</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 25px;">
              A new access request has been submitted and requires your attention.
            </p>
            
            ${requestDetailsHtml}
            
            ${imagesHtml}
            
            <div style="text-align: center; margin: 40px 0; padding: 25px; background-color: #fafafa; border-radius: 8px;">
              <p style="font-size: 18px; color: #333; margin-bottom: 25px; font-weight: 600;">
                Take Action:
              </p>
              
              <div style="display: inline-block; margin: 0 15px;">
                <a href="${approveUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(76,175,80,0.3); transition: all 0.3s ease;">
                  ✓ APPROVE
                </a>
              </div>
              
              <div style="display: inline-block; margin: 0 15px;">
                <a href="${rejectUrl}" 
                   style="background-color: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(244,67,54,0.3); transition: all 0.3s ease;">
                  ✗ REJECT
                </a>
              </div>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
              <p style="margin: 0; color: #1976d2; font-size: 14px; line-height: 1.5;">
                <strong>💡 Note:</strong> You can also log into the dashboard to review and take action on this request with additional options and detailed view.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated notification from the Access Request Management System.
            </p>
            <p style="font-size: 11px; color: #ccc; margin: 5px 0 0 0;">
              Please do not reply to this email. For support, contact your system administrator.
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
  sendActionNotificationToStaff,
  sendNewAccessRequestNotification,
};