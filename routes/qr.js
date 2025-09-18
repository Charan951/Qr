const express = require('express');
const { generateQRCode, generateQRCodeSVG, generateMultipleQRCodes } = require('../utils/qrGenerator');
const router = express.Router();

// @route   GET /api/qr/generate
// @desc    Generate QR code for access request form
// @access  Public
router.get('/generate', async (req, res) => {
  try {
    const { 
      baseUrl = 'http://localhost:3000/form',
      purpose,
      format = 'png',
      size = 256
    } = req.query;

    let formUrl = baseUrl;
    if (purpose) {
      formUrl += `?purpose=${encodeURIComponent(purpose)}`;
    }

    const options = {
      width: parseInt(size),
      margin: 2
    };

    let qrResult;
    
    if (format === 'svg') {
      qrResult = await generateQRCodeSVG(formUrl, options);
      if (qrResult.success) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(qrResult.svg);
      } else {
        res.status(500).json({ message: 'Failed to generate QR code', error: qrResult.error });
      }
    } else {
      qrResult = await generateQRCode(formUrl, options);
      if (qrResult.success) {
        res.json({
          success: true,
          qrCode: qrResult.dataURL,
          url: formUrl,
          format: 'data-url'
        });
      } else {
        res.status(500).json({ message: 'Failed to generate QR code', error: qrResult.error });
      }
    }

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ message: 'Server error while generating QR code' });
  }
});

// @route   POST /api/qr/batch
// @desc    Generate multiple QR codes for different purposes
// @access  Public
router.post('/batch', async (req, res) => {
  try {
    const { 
      baseUrl = 'http://localhost:3000/form',
      purposes = []
    } = req.body;

    if (!Array.isArray(purposes) || purposes.length === 0) {
      return res.status(400).json({ 
        message: 'Please provide an array of purposes' 
      });
    }

    const result = await generateMultipleQRCodes(baseUrl, purposes);

    if (result.success) {
      res.json({
        success: true,
        qrCodes: result.qrCodes,
        count: result.qrCodes.length
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to generate QR codes', 
        error: result.error 
      });
    }

  } catch (error) {
    console.error('Batch QR generation error:', error);
    res.status(500).json({ message: 'Server error while generating QR codes' });
  }
});

// @route   GET /api/qr/preview
// @desc    Preview QR code with custom styling
// @access  Public
router.get('/preview', async (req, res) => {
  try {
    const { 
      url = 'http://localhost:3000/form',
      darkColor = '#000000',
      lightColor = '#FFFFFF',
      size = 256,
      margin = 2
    } = req.query;

    const options = {
      width: parseInt(size),
      margin: parseInt(margin),
      color: {
        dark: darkColor,
        light: lightColor
      }
    };

    const qrResult = await generateQRCode(url, options);

    if (qrResult.success) {
      // Return HTML preview page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Preview</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              display: inline-block;
            }
            .qr-code {
              margin: 20px 0;
            }
            .url {
              word-break: break-all;
              background: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>QR Code Preview</h2>
            <div class="qr-code">
              <img src="${qrResult.dataURL}" alt="QR Code" />
            </div>
            <p><strong>URL:</strong></p>
            <div class="url">${url}</div>
            <p><small>Scan this QR code to access the form</small></p>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      res.status(500).json({ 
        message: 'Failed to generate QR code preview', 
        error: qrResult.error 
      });
    }

  } catch (error) {
    console.error('QR preview error:', error);
    res.status(500).json({ message: 'Server error while generating QR code preview' });
  }
});

module.exports = router;