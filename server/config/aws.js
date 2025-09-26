const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');

// AWS Configuration
const awsConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION || 'ap-south-1'
};

// Validate AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('AWS credentials not found in environment variables');
  console.error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
}

// Create S3 client
const s3 = new S3Client(awsConfig);

// S3 Bucket configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'speshway-dev-bucket1';

// Test S3 connection
const testS3Connection = async () => {
  try {
    console.log('Testing S3 connection...');
    const command = new ListObjectsCommand({ Bucket: S3_BUCKET, MaxKeys: 1 });
    const result = await s3.send(command);
    console.log('S3 connection successful!');
    return true;
  } catch (error) {
    console.error('S3 connection failed:', error.message);
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