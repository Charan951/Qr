import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

const ImageCapture = ({ onImageCapture, requestId }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  // Camera error handling and camera selection state
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState('user');

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode
  };

  const capture = useCallback(() => {
    if (!webcamRef.current) {
      setErrorMsg('Camera not initialized. Please try starting the camera again.');
      return;
    }
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setErrorMsg('Failed to capture image. Please try again, or switch camera.');
      return;
    }
    setCapturedImage(imageSrc);
    setIsCapturing(false);
  }, [webcamRef]);

  // Handle camera permission and device errors to guide the user
  const handleUserMediaError = useCallback((err) => {
    console.error('Camera error:', err);
    let message = 'Unable to access the camera.';
    if (err && err.name) {
      switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          message = 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          message = 'No camera device found. Please ensure a camera is connected and not in use by another app.';
          break;
        case 'NotReadableError':
          message = 'Camera is already in use by another application. Close other apps using the camera and retry.';
          break;
        case 'OverconstrainedError':
          message = 'Requested camera constraints are not supported on this device. Try switching camera.';
          break;
        case 'SecurityError':
          message = 'Camera access is blocked. Ensure you are using HTTPS (secure connection) and try again.';
          break;
        default:
          message = `Camera error: ${err.name}`;
      }
    }
    message += '\n\nTips:\n• Use the site over HTTPS (required on mobile browsers).\n• Allow camera permission when prompted.\n• On iOS Safari: Settings > Safari > Camera > Allow.\n• Try switching between front/back camera.';
    setErrorMsg(message);
    setIsCapturing(false);
  }, []);

  const handleUserMedia = useCallback(() => {
    setErrorMsg('');
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setIsCapturing(true);
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleImageCapture = (imageData) => {
    // Store the captured image data for later upload
    if (onImageCapture) {
      onImageCapture(imageData);
    }
  };

  const uploadImage = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      // If we have a requestId, upload immediately
      if (requestId) {
        const file = dataURLtoFile(capturedImage, `capture-${Date.now()}.jpg`);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('requestId', requestId);

        // Try to get token from different sources (admin, hr, or regular token)
        const token = localStorage.getItem('adminToken') || 
                     localStorage.getItem('hrToken') || 
                     localStorage.getItem('token');
        
        const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD), {
          method: 'POST',
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {},
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          setUploadStatus('Upload successful!');
          if (onImageCapture) {
            onImageCapture(data.imageUrl);
          }
          // Reset after successful upload
          setTimeout(() => {
            setCapturedImage(null);
            setUploadStatus('');
          }, 2000);
        } else {
          setUploadStatus(`Upload failed: ${data.message || 'Unknown error'}`);
        }
      } else {
        // If no requestId, just store the image data for later upload
        handleImageCapture(capturedImage);
        setUploadStatus('Image captured! Will be uploaded with form submission.');
        setTimeout(() => {
          setCapturedImage(null);
          setUploadStatus('');
        }, 2000);
      }
    } catch (error) {
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-800">Live Image Capture</h3>
      
      <div className="space-y-4">
        {!isCapturing && !capturedImage && (
          <div className="text-center">
            <button
              onClick={() => { setErrorMsg(''); setIsCapturing(true); }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Start Camera
            </button>
          </div>
        )}

        {isCapturing && !capturedImage && (
          <div className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm whitespace-pre-line">
                {errorMsg}
              </div>
            )}
            <div className="relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full max-w-xs sm:max-w-md mx-auto rounded-lg"
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                playsInline
              />
            </div>
            <div className="flex justify-center space-x-2 sm:space-x-4">
              <button
                onClick={capture}
                className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Capture Photo
              </button>
              <button
                onClick={() => setIsCapturing(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Switch Camera
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="text-center">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full max-w-xs sm:max-w-md mx-auto rounded-lg border-2 border-gray-300"
              />
            </div>
            <div className="flex justify-center space-x-2 sm:space-x-4">
              <button
                onClick={uploadImage}
                disabled={isUploading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </button>
              <button
                onClick={retake}
                disabled={isUploading}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Retake
              </button>
            </div>
            {uploadStatus && (
              <div className={`text-center p-2 rounded text-sm sm:text-base ${
                uploadStatus.includes('successful') 
                  ? 'bg-green-100 text-green-800' 
                  : uploadStatus.includes('failed') 
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {uploadStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCapture;