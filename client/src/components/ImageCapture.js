import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CameraAlt,
  Delete,
  CloudUpload,
  Refresh,
  Close,
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

// Animation variants for camera interactions
const cameraVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  capturing: {
    scale: [1, 0.95, 1],
    transition: { duration: 0.3 }
  }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 1, repeat: Infinity }
  }
};

const flashVariants = {
  flash: {
    opacity: [0, 1, 0],
    transition: { duration: 0.3 }
  }
};

const uploadVariants = {
  uploading: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  },
  success: {
    scale: [1, 1.2, 1],
    backgroundColor: ["#4caf50", "#66bb6a", "#4caf50"],
    transition: { duration: 0.6 }
  },
  error: {
    x: [-10, 10, -10, 10, 0],
    backgroundColor: ["#f44336", "#ef5350", "#f44336"],
    transition: { duration: 0.4 }
  }
};

const ImageCapture = ({ onImageCapture, requestId }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setIsCapturing(false);
  }, [webcamRef]);

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
              onClick={() => setIsCapturing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Start Camera
            </button>
          </div>
        )}

        {isCapturing && !capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full max-w-xs sm:max-w-md mx-auto rounded-lg"
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