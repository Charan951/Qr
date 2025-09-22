const express = require('express');
const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');
const Message = require('../models/Message');
const { auth, adminOrHRAuth } = require('../middleware/auth');
const { sendAccessRequestNotification, sendApproverNotification } = require('../services/emailService');
const router = express.Router();

// Apply auth middleware to all HR routes
router.use(auth);
router.use(adminOrHRAuth);

// @route   GET /api/hr/requests
// @desc    Get all access requests (read-only for HR)
// @access  Private (HR/Admin)
router.get('/requests', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      startDate,
      endDate,
      sortBy = 'submittedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { whomToMeet: { $regex: search, $options: 'i' } },
        { referenceName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      filter.submittedDate = {};
      if (startDate) {
        filter.submittedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.submittedDate.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const requests = await AccessRequest.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AccessRequest.countDocuments(filter);

    // Get status counts
    const statusCounts = await AccessRequest.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = {
      total,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
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
      },
      counts,
      readOnly: req.user.role === 'hr' // Indicate read-only mode for HR
    });

  } catch (error) {
    console.error('Get HR requests error:', error);
    res.status(500).json({ message: 'Server error while fetching requests' });
  }
});

// @route   GET /api/hr/requests/:id
// @desc    Get single request details (read-only for HR)
// @access  Private (HR/Admin)
router.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const request = await AccessRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({
      success: true,
      data: request,
      readOnly: req.user.role === 'hr'
    });

  } catch (error) {
    console.error('Get HR request details error:', error);
    res.status(500).json({ message: 'Server error while fetching request details' });
  }
});

// @route   GET /api/hr/dashboard/stats
// @desc    Get dashboard statistics for HR (read-only)
// @access  Private (HR/Admin)
router.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalRequests,
      todayRequests,
      weekRequests,
      monthRequests,
      statusCounts,
      recentRequests
    ] = await Promise.all([
      AccessRequest.countDocuments(),
      AccessRequest.countDocuments({ submittedDate: { $gte: startOfDay } }),
      AccessRequest.countDocuments({ submittedDate: { $gte: startOfWeek } }),
      AccessRequest.countDocuments({ submittedDate: { $gte: startOfMonth } }),
      AccessRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      AccessRequest.find().sort({ submittedDate: -1 }).limit(5)
    ]);

    const stats = {
      total: totalRequests,
      today: todayRequests,
      week: weekRequests,
      month: monthRequests,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    statusCounts.forEach(item => {
      stats[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        stats,
        recentRequests
      },
      readOnly: req.user.role === 'hr'
    });

  } catch (error) {
    console.error('HR dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard stats' });
  }
});

// @route   GET /api/hr/reports/summary
// @desc    Get summary reports for HR
// @access  Private (HR/Admin)
router.get('/reports/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.submittedDate = {};
      if (startDate) {
        dateFilter.submittedDate.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.submittedDate.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const [
      statusSummary,
      dailySummary,
      departmentSummary
    ] = await Promise.all([
      // Status summary
      AccessRequest.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Daily summary
      AccessRequest.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$submittedDate' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': -1 } },
        { $limit: 30 }
      ]),
      
      // Department/Meeting summary
      AccessRequest.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$whomToMeet', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        statusSummary,
        dailySummary,
        departmentSummary
      },
      readOnly: req.user.role === 'hr'
    });

  } catch (error) {
    console.error('HR reports summary error:', error);
    res.status(500).json({ message: 'Server error while fetching reports summary' });
  }
});

// @route   PATCH /api/hr/requests/:id
// @desc    Approve or reject a request (HR can now take actions)
// @access  Private (HR/Admin)
router.patch('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    console.log('HR PATCH /requests/:id - Request received:', {
      id,
      status,
      rejectionReason,
      body: req.body,
      user: req.user.username,
      role: req.user.role
    });

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ 
        message: 'Invalid request ID format' 
      });
    }

    // Check if status is provided
    if (!status) {
      console.log('No status provided');
      return res.status(400).json({ 
        message: 'Status is required for request updates' 
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ 
        message: 'Status must be either "approved" or "rejected"' 
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      console.log('Missing rejection reason for rejected status');
      return res.status(400).json({ 
        message: 'Rejection reason is required when rejecting a request' 
      });
    }

    const updateData = {
      status,
      approvedBy: req.user.username,
      approvedAt: new Date()
    };

    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
    }

    console.log('HR attempting to update request with data:', updateData);

    const request = await AccessRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Process notifications asynchronously to improve response time
    setImmediate(async () => {
      try {
        // Get all required users in a single optimized query
        const [hrUser, adminUsers] = await Promise.all([
          User.findOne({ username: req.user.username }).select('email'),
          User.find({ role: 'admin', isActive: true }).select('email')
        ]);

        // Prepare all email operations
        const emailPromises = [];
        
        // Send email to the user who made the request
        emailPromises.push(
          sendAccessRequestNotification(
            request.email,
            request.fullName,
            status,
            'HR',
            req.user.username,
            request
          )
        );

        // Send confirmation email to the HR who took the action
        if (hrUser && hrUser.email) {
          emailPromises.push(
            sendApproverNotification(
              hrUser.email,
              req.user.username,
              request.fullName,
              status,
              {
                email: request.email,
                purpose: request.purposeOfAccess,
                whomToMeet: request.whomToMeet,
                images: request.images
              }
            )
          );
        }

        // Send notification emails to all admin users in parallel
        adminUsers.forEach(adminUser => {
          if (adminUser.email) {
            emailPromises.push(
              sendApproverNotification(
                adminUser.email,
                req.user.username,
                request.fullName,
                status,
                {
                  email: request.email,
                  purpose: request.purposeOfAccess,
                  whomToMeet: request.whomToMeet,
                  images: request.images
                }
              )
            );
          }
        });

        // Execute all email operations in parallel
        await Promise.allSettled(emailPromises);

        // Create message for both admin and HR to see
        if (status === 'approved') {
          await Message.createApprovalMessage({
            userName: request.fullName,
            userEmail: request.email,
            approverName: req.user.username,
            approverRole: 'hr',
            requestId: request._id,
            userId: request._id
          });
        } else {
          await Message.createRejectionMessage({
            userName: request.fullName,
            userEmail: request.email,
            approverName: req.user.username,
            approverRole: 'hr',
            requestId: request._id,
            userId: request._id,
            reason: rejectionReason
          });
        }

        console.log('Email notifications and messages processed successfully');
      } catch (emailError) {
        console.error('Error processing notifications:', emailError);
        // Log error but don't affect the main response
      }
    });

    res.json({
      success: true,
      message: `Request ${status} successfully by HR`,
      data: request
    });

  } catch (error) {
    console.error('HR request update error:', error);
    res.status(500).json({ message: 'Server error while updating request' });
  }
});

// @route   PATCH /api/hr/requests/bulk
// @desc    Bulk update multiple access requests
// @access  Private (HR/Admin)
router.patch('/requests/bulk', async (req, res) => {
  try {
    const { requestIds, status, rejectionReason } = req.body;

    // Validate input
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ message: 'Request IDs array is required' });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required' });
    }

    if (status === 'rejected' && !rejectionReason?.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required for rejected status' });
    }

    // Build update data
    const updateData = {
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user.username
    };

    if (status === 'approved') {
      updateData.approvedBy = req.user.username;
      updateData.approvedAt = new Date();
    }

    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason.trim();
    }

    console.log('HR attempting bulk update with data:', updateData);
    console.log('Request IDs:', requestIds);

    // Update multiple requests
    const result = await AccessRequest.updateMany(
      { 
        _id: { $in: requestIds },
        status: 'pending' // Only update pending requests
      },
      updateData
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No pending requests found with provided IDs' });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} request(s) ${status} successfully by HR`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('HR bulk request update error:', error);
    res.status(500).json({ message: 'Server error while updating requests' });
  }
});

module.exports = router;