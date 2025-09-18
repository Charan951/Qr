const express = require('express');
const AccessRequest = require('../models/AccessRequest');
const { auth, adminOrHRAuth } = require('../middleware/auth');
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

module.exports = router;