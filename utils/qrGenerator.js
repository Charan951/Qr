const QRCode = require('qrcode');

// Generate QR code for access request form
const generateQRCode = async (formUrl, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(formUrl, qrOptions);
    
    return {
      success: true,
      dataURL: qrCodeDataURL,
      url: formUrl
    };
  } catch (error) {
    console.error('QR Code generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate QR code as buffer
const generateQRCodeBuffer = async (formUrl, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(formUrl, qrOptions);
    
    return {
      success: true,
      buffer: qrCodeBuffer,
      url: formUrl
    };
  } catch (error) {
    console.error('QR Code buffer generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate QR code as SVG
const generateQRCodeSVG = async (formUrl, options = {}) => {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    // Generate QR code as SVG string
    const qrCodeSVG = await QRCode.toString(formUrl, { 
      ...qrOptions, 
      type: 'svg' 
    });
    
    return {
      success: true,
      svg: qrCodeSVG,
      url: formUrl
    };
  } catch (error) {
    console.error('QR Code SVG generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate multiple QR codes for different purposes
const generateMultipleQRCodes = async (baseUrl, purposes = []) => {
  try {
    const qrCodes = [];
    
    for (const purpose of purposes) {
      const formUrl = `${baseUrl}?purpose=${encodeURIComponent(purpose)}`;
      const qrCode = await generateQRCode(formUrl);
      
      if (qrCode.success) {
        qrCodes.push({
          purpose,
          url: formUrl,
          dataURL: qrCode.dataURL
        });
      }
    }
    
    return {
      success: true,
      qrCodes
    };
  } catch (error) {
    console.error('Multiple QR codes generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBuffer,
  generateQRCodeSVG,
  generateMultipleQRCodes
};