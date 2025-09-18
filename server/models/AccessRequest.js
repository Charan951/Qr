const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  
  // Access/Visit Details
  purposeOfAccess: {
    type: String,
    required: true,
    trim: true
  },
  whomToMeet: {
    type: String,
    required: true,
    trim: true
  },
  
  // Reference Details
  referenceName: {
    type: String,
    required: true,
    trim: true
  },
  referencePhoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Submission Details
  submittedDate: {
    type: Date,
    default: Date.now
  },
  submittedTime: {
    type: String,
    default: () => new Date().toLocaleTimeString()
  },
  
  // Approval Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
accessRequestSchema.index({ email: 1, submittedDate: -1 });
accessRequestSchema.index({ status: 1, submittedDate: -1 });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);