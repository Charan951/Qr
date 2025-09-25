const { S3Client, ListObjectsCommand, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION || 'ap-south-1'
});

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'speshway-dev-bucket1';

async function testS3Operations() {
  console.log('Testing S3 operations...');
  console.log('Bucket:', S3_BUCKET);
  console.log('Region:', process.env.AWS_REGION);
  
  try {
    // Test 1: List objects
    console.log('\n1. Testing ListObjects...');
    const listCommand = new ListObjectsCommand({ Bucket: S3_BUCKET, MaxKeys: 5 });
    const listResult = await s3.send(listCommand);
    console.log('✅ ListObjects successful');
    console.log('Objects found:', listResult.Contents?.length || 0);
    
    // Test 2: Upload a test file
    console.log('\n2. Testing PutObject...');
    const testContent = Buffer.from('Test file content');
    const putCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: 'test-upload.txt',
      Body: testContent,
      ContentType: 'text/plain'
    });
    
    const putResult = await s3.send(putCommand);
    console.log('✅ PutObject successful');
    console.log('ETag:', putResult.ETag);
    
    // Test 3: Get the uploaded file
    console.log('\n3. Testing GetObject...');
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: 'test-upload.txt'
    });
    
    const getResult = await s3.send(getCommand);
    console.log('✅ GetObject successful');
    console.log('Content-Type:', getResult.ContentType);
    
    console.log('\n🎉 All S3 operations successful!');
    
  } catch (error) {
    console.error('\n❌ S3 operation failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Status code:', error.$metadata?.httpStatusCode);
    console.error('Request ID:', error.$metadata?.requestId);
    
    if (error.code === 'NoSuchBucket') {
      console.error('\n💡 The bucket does not exist or you don\'t have access to it.');
    } else if (error.code === 'AccessDenied') {
      console.error('\n💡 Access denied. Check your AWS credentials and bucket permissions.');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.error('\n💡 Invalid AWS Access Key ID.');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error('\n💡 Invalid AWS Secret Access Key.');
    }
  }
}

testS3Operations();