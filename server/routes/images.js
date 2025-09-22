const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { s3, S3_BUCKET } = require('../config/aws');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const AccessRequest = require('../models/AccessRequest');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

    // Generate filename
    const timestamp = Date.now();
    const filename = `images/${timestamp}-${req.file.originalname}`;
    console.log('Generating filename:', filename);

    let imageUrl;
    let isLocalStorage = false;

    try {
      // Try to upload to S3 first
      const uploadParams = {
        Bucket: S3_BUCKET,
        Key: filename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };

      console.log('Attempting S3 upload...');
      const uploadResult = await s3.send(new PutObjectCommand(uploadParams));
      imageUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
      console.log('File uploaded to S3:', imageUrl);
    } catch (s3Error) {
      console.log('S3 upload failed, falling back to local storage:', s3Error.message);
      
      // Fallback to local storage
      const localFilename = `${timestamp}-${req.file.originalname}`;
      const localPath = path.join(uploadsDir, localFilename);
      
      fs.writeFileSync(localPath, req.file.buffer);
      imageUrl = `/uploads/${localFilename}`;
      isLocalStorage = true;
      console.log('File saved locally:', imageUrl);
    }
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
    await s3.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: filename
    }));

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