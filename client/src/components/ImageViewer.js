import React, { useState, useEffect } from 'react';

const ImageViewer = ({ requestId, images: propImages }) => {
  const [images, setImages] = useState(propImages || []);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (requestId && !propImages) {
      fetchImages();
    }
  }, [requestId, propImages]);

  const fetchImages = async () => {
    if (!requestId) return;

    console.log('ImageViewer: Fetching images for requestId:', requestId);
    setLoading(true);
    setError('');

    try {
      // Try to get token from different sources (admin, hr, or regular token)
      const token = localStorage.getItem('adminToken') || 
                   localStorage.getItem('hrToken') || 
                   localStorage.getItem('token');
      
      console.log('ImageViewer: Using token:', token ? 'Token found' : 'No token');
      
      const response = await fetch(`http://localhost:5000/api/images/request/${requestId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      const data = await response.json();
      console.log('ImageViewer: API response:', data);

      if (response.ok) {
        console.log('ImageViewer: Setting images:', data.images || []);
        setImages(data.images || []);
      } else {
        console.error('ImageViewer: API error:', data.message);
        setError(data.message || 'Failed to fetch images');
      }
    } catch (error) {
      console.error('Fetch images error:', error);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const filename = imageUrl.split('/').pop();
      // Try to get token from different sources (admin, hr, or regular token)
      const token = localStorage.getItem('adminToken') || 
                   localStorage.getItem('hrToken') || 
                   localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/images/${filename}`, {
        method: 'DELETE',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        setImages(images.filter(img => img !== imageUrl));
        if (selectedImage === imageUrl) {
          setSelectedImage(null);
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete image error:', error);
      setError('Failed to delete image. Please try again.');
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Uploaded Images</h3>
        {requestId && (
          <button
            onClick={fetchImages}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2">No images uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => openImageModal(imageUrl)}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                  }}
                />
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteImage(imageUrl)}
                  className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                  title="Delete image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;