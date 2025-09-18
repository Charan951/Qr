const express = require('express');
const Message = require('../models/Message');
const { auth, adminOrHRAuth } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all message routes
router.use(auth);
router.use(adminOrHRAuth);

// @route   GET /api/messages
// @desc    Get messages for admin/HR with pagination and filtering
// @access  Private (Admin/HR)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {
      recipient: { $in: ['both', req.user.role] } // Show messages for 'both' or specific role
    };
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const messages = await Message.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(filter);
    const unreadCount = await Message.countDocuments({
      ...filter,
      isRead: false
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      unreadCount
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get count of unread messages
// @access  Private (Admin/HR)
router.get('/unread-count', async (req, res) => {
  try {
    const filter = {
      recipient: { $in: ['both', req.user.role] },
      isRead: false
    };

    const unreadCount = await Message.countDocuments(filter);

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

// @route   PATCH /api/messages/:id/read
// @desc    Mark a message as read
// @access  Private (Admin/HR)
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'Invalid message ID format' 
      });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user has permission to read this message
    if (message.recipient !== 'both' && message.recipient !== req.user.role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.markAsReadBy(req.user.id, req.user.role);

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Server error while updating message' });
  }
});

// @route   PATCH /api/messages/mark-all-read
// @desc    Mark all messages as read for the current user
// @access  Private (Admin/HR)
router.patch('/mark-all-read', async (req, res) => {
  try {
    const filter = {
      recipient: { $in: ['both', req.user.role] },
      isRead: false
    };

    const messages = await Message.find(filter);
    let modifiedCount = 0;

    for (const message of messages) {
      await message.markAsReadBy(req.user.id, req.user.role);
      modifiedCount++;
    }

    res.json({
      success: true,
      message: `${modifiedCount} messages marked as read`,
      modifiedCount: modifiedCount
    });

  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({ message: 'Server error while updating messages' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private (Admin/HR)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'Invalid message ID format' 
      });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user has permission to delete this message
    if (message.recipient !== 'both' && message.recipient !== req.user.role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Message.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error while deleting message' });
  }
});

module.exports = router;