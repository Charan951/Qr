const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const router = express.Router();

// Configure AWS
console.log('Configuring AWS with:', {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET_NAME
});

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const fileName = `access-requests/${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read'
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload image endpoint
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File info:', req.file ? 'File present' : 'No file');
    
    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    console.log('File uploaded successfully:', req.file.location);
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: req.file.location,
      imageName: req.file.key
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'Upload failed'
  });
});

module.exports = router;