const express = require('express');
const AccessRequest = require('../models/AccessRequest');
const router = express.Router();

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