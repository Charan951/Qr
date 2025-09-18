const AWS = require('aws-sdk');

// AWS Configuration
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAWXDXCIJMTVDLGZB4',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
  region: process.env.AWS_REGION || 'ap-south-1'
};

// Configure AWS
AWS.config.update(awsConfig);

// Create S3 instance
const s3 = new AWS.S3();

// S3 Bucket configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'speshway-dev-bucket1';

// Test S3 connection
const testS3Connection = async () => {
  try {
    console.log('Testing S3 connection...');
    const result = await s3.listObjects({ Bucket: S3_BUCKET, MaxKeys: 1 }).promise();
    console.log('S3 connection successful!');
    return true;
  } catch (error) {
    console.error('S3 connection failed:', error.message);
    return false;
  }
};

// Test connection on startup
testS3Connection();

module.exports = {
  s3,
  S3_BUCKET,
  awsConfig,
  testS3Connection
};