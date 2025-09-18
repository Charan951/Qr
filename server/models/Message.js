const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
    enum: ['admin', 'hr', 'both'] // Who should see this message
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['approval', 'rejection', 'info', 'warning']
  },
  relatedUser: {
    type: String, // Name of the user whose request was processed
    required: true
  },
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessRequest'
  },
  actionBy: {
    type: String, // Name of admin/hr who took the action
    required: true
  },
  actionByRole: {
    type: String,
    required: true,
    enum: ['admin', 'hr']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'hr']
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    requestType: String,
    department: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, createdAt: -1 });
messageSchema.index({ actionByRole: 1, createdAt: -1 });

// Static method to create approval message
messageSchema.statics.createApprovalMessage = function(data) {
  const { userName, userEmail, approverName, approverRole, requestId, userId } = data;
  
  return this.create({
    recipient: 'both', // Both admin and HR should see approval messages
    title: `Access Request Approved`,
    message: `${approverRole.toUpperCase()} ${approverName} approved access request for ${userName} (${userEmail})`,
    type: 'approval',
    relatedUser: userName,
    relatedUserId: userId,
    relatedRequestId: requestId,
    actionBy: approverName,
    actionByRole: approverRole,
    priority: 'high',
    metadata: {
      requestType: 'access_request',
      action: 'approved'
    }
  });
};

// Static method to create rejection message
messageSchema.statics.createRejectionMessage = function(data) {
  const { userName, userEmail, approverName, approverRole, requestId, userId, reason } = data;
  
  return this.create({
    recipient: 'both', // Both admin and HR should see rejection messages
    title: `Access Request Rejected`,
    message: `${approverRole.toUpperCase()} ${approverName} rejected access request for ${userName} (${userEmail})${reason ? `. Reason: ${reason}` : ''}`,
    type: 'rejection',
    relatedUser: userName,
    relatedUserId: userId,
    relatedRequestId: requestId,
    actionBy: approverName,
    actionByRole: approverRole,
    priority: 'medium',
    metadata: {
      requestType: 'access_request',
      action: 'rejected',
      reason: reason || null
    }
  });
};

// Instance method to mark as read by specific user
messageSchema.methods.markAsReadBy = function(userId, role) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(read => 
    read.userId.toString() === userId.toString() && read.role === role
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      userId: userId,
      role: role,
      readAt: new Date()
    });
    
    // If both admin and HR have read it, mark as fully read
    const adminRead = this.readBy.some(read => read.role === 'admin');
    const hrRead = this.readBy.some(read => read.role === 'hr');
    
    if (this.recipient === 'both' && adminRead && hrRead) {
      this.isRead = true;
    } else if (this.recipient === role) {
      this.isRead = true;
    }
  }
  
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;