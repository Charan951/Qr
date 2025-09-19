const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { s3, S3_BUCKET } = require('../config/aws');
const AccessRequest = require('../models/AccessRequest');

const router = express.Router();

// Configure multer for S3 upload using direct AWS SDK approach
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter - MIME type:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      console.log('File accepted');
      cb(null, true);
    } else {
      console.log('File rejected - not an image');
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload image endpoint - disable body parsing for multipart
router.post('/upload', (req, res, next) => {
  console.log('=== IMAGE UPLOAD REQUEST RECEIVED ===');
  console.log('Request headers:', req.headers);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  // Skip express.json() and express.urlencoded() for this route
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    console.log('Image upload request received');
    console.log('File:', req.file ? 'Present' : 'Missing');
    console.log('Body:', req.body);

    if (!req.file) {
      console.log('No image file provided in request');
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Generate S3 key
    const timestamp = Date.now();
    const filename = `images/${timestamp}-${req.file.originalname}`;
    console.log('Generating S3 key:', filename);

    // Upload to S3 using direct AWS SDK
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: filename,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
      // Removed ACL: 'public-read' as the bucket doesn't allow ACLs
    };

    console.log('Uploading to S3...');
    const uploadResult = await s3.upload(uploadParams).promise();
    console.log('File uploaded to S3:', uploadResult.Location);

    const imageUrl = uploadResult.Location;
    const { requestId } = req.body;

    // Update access request with image URL if requestId is provided
    if (requestId) {
      console.log('Updating request with ID:', requestId);
      const updatedRequest = await AccessRequest.findByIdAndUpdate(requestId, {
        $push: { images: imageUrl }
      }, { new: true });
      console.log('Request updated:', updatedRequest ? 'Success' : 'Failed');
      
      // Only send email notifications if this is the first image being uploaded
      // This prevents duplicate emails when multiple images are uploaded
      if (updatedRequest && updatedRequest.images.length === 1) {
        try {
          const { sendNewAccessRequestNotification } = require('../services/emailService');
          const User = require('../models/User');

          // Get all active HR users
          const hrUsers = await User.find({ role: 'hr', isActive: true }).select('email username');
          
          // Get all active Admin users  
          const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email username');

          // Send notifications to all HR users
          for (const hrUser of hrUsers) {
            if (hrUser.email) {
              try {
                await sendNewAccessRequestNotification(
                  hrUser.email,
                  hrUser.username,
                  'HR',
                  updatedRequest
                );
                console.log(`Updated request notification sent to HR: ${hrUser.email}`);
              } catch (emailError) {
                console.error(`Failed to send email to HR ${hrUser.email}:`, emailError);
              }
            }
          }

          // Send notifications to all Admin users
          for (const adminUser of adminUsers) {
            if (adminUser.email) {
              try {
                await sendNewAccessRequestNotification(
                  adminUser.email,
                  adminUser.username,
                  'Admin',
                  updatedRequest
                );
                console.log(`Updated request notification sent to Admin: ${adminUser.email}`);
              } catch (emailError) {
                console.error(`Failed to send email to Admin ${adminUser.email}:`, emailError);
              }
            }
          }

        } catch (error) {
          console.error('Error sending email notifications after first image upload:', error);
          // Don't fail the image upload if email fails
        }
      } else if (updatedRequest && updatedRequest.images.length > 1) {
        console.log(`Skipping email notification - this is image ${updatedRequest.images.length} of multiple uploads`);
      }
    }

    console.log('Image upload successful, returning response');
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.key
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
});

// Get images for a specific request
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await AccessRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({
      images: request.images || []
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ message: 'Failed to get images', error: error.message });
  }
});

// Delete image endpoint
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Delete from S3
    await s3.deleteObject({
      Bucket: S3_BUCKET,
      Key: filename
    }).promise();

    // Remove from database (find and update all requests that have this image)
    await AccessRequest.updateMany(
      { images: { $regex: filename } },
      { $pull: { images: { $regex: filename } } }
    );

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
});

module.exports = router;