const express = require('express');
const XLSX = require('xlsx');
const moment = require('moment');
const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');
const Message = require('../models/Message');
const { auth, adminAuth } = require('../middleware/auth');
const { sendAccessRequestNotification, sendApproverNotification } = require('../services/emailService');
const router = express.Router();

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminAuth);

// @route   GET /api/admin/requests
// @desc    Get all access requests with filtering and pagination
// @access  Private (Admin)
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
      counts
    });

  } catch (error) {
    console.error('Get admin requests error:', error);
    res.status(500).json({ message: 'Server error while fetching requests' });
  }
});

// @route   PATCH /api/admin/requests/:id
// @desc    Approve or reject a request
// @access  Private (Admin)
router.patch('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, requestId } = req.body;

    console.log('PATCH /requests/:id - Request received:', {
      id,
      status,
      rejectionReason,
      requestId,
      body: req.body,
      statusType: typeof req.body.status,
      requestIdType: typeof req.body.requestId,
      hasStatus: 'status' in req.body,
      hasRequestId: 'requestId' in req.body
    });

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ 
        message: 'Invalid request ID format' 
      });
    }

    // If only updating requestId (for migration purposes)
    if (req.body.requestId !== undefined && (req.body.status === undefined || req.body.status === null)) {
      console.log('Updating requestId only:', req.body.requestId);
      const request = await AccessRequest.findByIdAndUpdate(
        id,
        { requestId: req.body.requestId },
        { new: true }
      );

      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      return res.json({
        success: true,
        message: 'Request ID updated successfully',
        data: request
      });
    }

    // Check if status is provided for regular updates
    if (!status) {
      console.log('No status provided and no requestId update');
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

    console.log('Attempting to update request with data:', updateData);

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
        const [adminUser, hrUsers] = await Promise.all([
          User.findOne({ username: req.user.username }).select('email'),
          User.find({ role: 'hr', isActive: true }).select('email')
        ]);

        // Prepare all email operations
        const emailPromises = [];
        
        // Send email to the user who made the request
        emailPromises.push(
          sendAccessRequestNotification(
            request.email,
            request.fullName,
            status,
            'Admin',
            req.user.username,
            request
          )
        );

        // Send notification emails to all HR users only (not to the admin who took the action to avoid duplicates)
        hrUsers.forEach(hrUser => {
          if (hrUser.email) {
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
        });

        // Execute all email operations in parallel
        await Promise.allSettled(emailPromises);

        // Create message for both admin and HR to see
        if (status === 'approved') {
          await Message.createApprovalMessage({
            userName: request.fullName,
            userEmail: request.email,
            approverName: req.user.username,
            approverRole: 'admin',
            requestId: request._id,
            userId: request._id
          });
        } else {
          await Message.createRejectionMessage({
            userName: request.fullName,
            userEmail: request.email,
            approverName: req.user.username,
            approverRole: 'admin',
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
      message: `Request ${status} successfully`,
      data: request
    });

  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error while updating request' });
  }
});

// @route   GET /api/admin/hr-users
// @desc    Get all HR users
// @access  Private (Admin)
router.get('/hr-users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let filter = { role: 'hr' };
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const hrUsers = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: hrUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get HR users error:', error);
    res.status(500).json({ message: 'Server error while fetching HR users' });
  }
});

// @route   POST /api/admin/hr-users
// @desc    Create new HR user
// @access  Private (Admin)
router.post('/hr-users', async (req, res) => {
  try {
    const { username, email, password, isActive = true } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide username, email, and password' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this username or email already exists' 
      });
    }

    // Create new HR user
    const hrUser = new User({
      username,
      email,
      password,
      role: 'hr',
      isActive: Boolean(isActive)
    });

    await hrUser.save();

    // Return user without password
    const userResponse = {
      id: hrUser._id,
      username: hrUser.username,
      email: hrUser.email,
      role: hrUser.role,
      isActive: hrUser.isActive,
      createdAt: hrUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'HR user created successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Create HR user error:', error);
    res.status(500).json({ message: 'Server error while creating HR user' });
  }
});

// @route   PUT /api/admin/hr-users/:id
// @desc    Update HR user
// @access  Private (Admin)
router.put('/hr-users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, isActive, password } = req.body;

    const hrUser = await User.findById(id);
    
    if (!hrUser || hrUser.role !== 'hr') {
      return res.status(404).json({ message: 'HR user not found' });
    }

    // Check if username/email already exists (excluding current user)
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Username or email already exists' 
        });
      }
    }

    // Update fields
    if (username) hrUser.username = username;
    if (email) hrUser.email = email;
    if (typeof isActive === 'boolean') hrUser.isActive = isActive;
    if (password) hrUser.password = password;

    await hrUser.save();

    // Return user without password
    const userResponse = {
      id: hrUser._id,
      username: hrUser.username,
      email: hrUser.email,
      role: hrUser.role,
      isActive: hrUser.isActive,
      updatedAt: hrUser.updatedAt
    };

    res.json({
      success: true,
      message: 'HR user updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Update HR user error:', error);
    res.status(500).json({ message: 'Server error while updating HR user' });
  }
});

// @route   DELETE /api/admin/hr-users/:id
// @desc    Delete HR user
// @access  Private (Admin)
router.delete('/hr-users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hrUser = await User.findById(id);
    
    if (!hrUser || hrUser.role !== 'hr') {
      return res.status(404).json({ message: 'HR user not found' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'HR user deleted successfully'
    });

  } catch (error) {
    console.error('Delete HR user error:', error);
    res.status(500).json({ message: 'Server error while deleting HR user' });
  }
});

// @route   GET /api/admin/export/all
// @desc    Export all access requests to Excel
// @access  Private (Admin)
router.get('/export/all', async (req, res) => {
  try {
    const requests = await AccessRequest.find({}).sort({ submittedDate: -1 });

    const excelData = requests.map(request => ({
      'Full Name': request.fullName,
      'Email': request.email,
      'Phone': request.phoneNumber || 'N/A',
      'Purpose': request.purposeOfAccess,
      'Whom to Meet': request.whomToMeet,
      'Reference Name': request.referenceName,
      'Reference Phone': request.referencePhoneNumber,
      'Submitted Date': moment(request.submittedDate).format('YYYY-MM-DD'),
      'Submitted Time': request.submittedTime,
      'Status': request.status.toUpperCase(),
      'Approved By': request.approvedBy || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Access Requests');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=all-access-requests-${moment().format('YYYY-MM-DD')}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export all error:', error);
    res.status(500).json({ message: 'Server error while exporting data' });
  }
});

// @route   GET /api/admin/export/day/:date
// @desc    Export Excel for specific day
// @access  Private (Admin)
router.get('/export/day/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date + 'T23:59:59.999Z');

    const requests = await AccessRequest.find({
      submittedDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ submittedDate: -1 });

    const excelData = requests.map(request => ({
      'Full Name': request.fullName,
      'Email': request.email,
      'Phone': request.phoneNumber || 'N/A',
      'Purpose': request.purposeOfAccess,
      'Whom to Meet': request.whomToMeet,
      'Reference Name': request.referenceName,
      'Reference Phone': request.referencePhoneNumber,
      'Submitted Date': moment(request.submittedDate).format('YYYY-MM-DD'),
      'Submitted Time': request.submittedTime,
      'Status': request.status.toUpperCase(),
      'Approved By': request.approvedBy || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Access Requests');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=access-requests-${date}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export day error:', error);
    res.status(500).json({ message: 'Server error while exporting data' });
  }
});

// @route   GET /api/admin/export/range
// @desc    Export Excel for date range
// @access  Private (Admin)
router.get('/export/range', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ 
        message: 'Please provide both from and to dates' 
      });
    }

    const startDate = new Date(from);
    const endDate = new Date(to + 'T23:59:59.999Z');

    const requests = await AccessRequest.find({
      submittedDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ submittedDate: -1 });

    const excelData = requests.map(request => ({
      'Full Name': request.fullName,
      'Email': request.email,
      'Phone': request.phoneNumber || 'N/A',
      'Purpose': request.purposeOfAccess,
      'Whom to Meet': request.whomToMeet,
      'Reference Name': request.referenceName,
      'Reference Phone': request.referencePhoneNumber,
      'Submitted Date': moment(request.submittedDate).format('YYYY-MM-DD'),
      'Submitted Time': request.submittedTime,
      'Status': request.status.toUpperCase(),
      'Approved By': request.approvedBy || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Access Requests');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=access-requests-${from}-to-${to}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export range error:', error);
    res.status(500).json({ message: 'Server error while exporting data' });
  }
});

// @route   GET /api/admin/export/month/:year/:month
// @desc    Export Excel for specific month
// @access  Private (Admin)
router.get('/export/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const requests = await AccessRequest.find({
      submittedDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ submittedDate: -1 });

    const excelData = requests.map(request => ({
      'Full Name': request.fullName,
      'Email': request.email,
      'Phone': request.phoneNumber || 'N/A',
      'Purpose': request.purposeOfAccess,
      'Whom to Meet': request.whomToMeet,
      'Reference Name': request.referenceName,
      'Reference Phone': request.referencePhoneNumber,
      'Submitted Date': moment(request.submittedDate).format('YYYY-MM-DD'),
      'Submitted Time': request.submittedTime,
      'Status': request.status.toUpperCase(),
      'Approved By': request.approvedBy || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Access Requests');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const monthName = moment().month(month - 1).format('MMMM');
    res.setHeader('Content-Disposition', `attachment; filename=access-requests-${monthName}-${year}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Export month error:', error);
    res.status(500).json({ message: 'Server error while exporting data' });
  }
});

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
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
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard stats' });
  }
});

module.exports = router;