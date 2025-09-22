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
    trim: true
  },
  referencePhoneNumber: {
    type: String,
    trim: true
  },
  
  // Training Details
  trainingName: {
    type: String,
    trim: true
  },
  trainerNumber: {
    type: String,
    trim: true
  },
  
  // Department Details (for training and assignment)
  departmentName: {
    type: String,
    trim: true
  },
  
  // Visitor Details
  visitorDescription: {
    type: String,
    trim: true
  },
  
  // Client Details
  companyName: {
    type: String,
    trim: true
  },
  clientMobileNumber: {
    type: String,
    trim: true
  },
  
  // Interview Details
  interviewPosition: {
    type: String,
    trim: true
  },
  interviewerName: {
    type: String,
    trim: true
  },
  interviewerPhone: {
    type: String,
    trim: true
  },
  interviewType: {
    type: String,
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
  },
  
  // Image Storage
  images: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Optimized indexes for better query performance
accessRequestSchema.index({ email: 1, submittedDate: -1 });
accessRequestSchema.index({ status: 1, submittedDate: -1 });
accessRequestSchema.index({ status: 1, createdAt: -1 }); // For dashboard queries
accessRequestSchema.index({ approvedBy: 1, approvedAt: -1 }); // For approval tracking
accessRequestSchema.index({ _id: 1, status: 1 }); // For update operations

module.exports = mongoose.model('AccessRequest', accessRequestSchema);