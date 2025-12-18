import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { CheckCircle, Cancel, Error, Home } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../config/api';

const EmailAction = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const processEmailAction = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No token provided in the request.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getBaseUrl()}/api/requests/email-action?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const htmlText = await response.text();
          const isApproved = htmlText.includes('Request Approved');
          const isRejected = htmlText.includes('Request Rejected');
          
          if (isApproved || isRejected) {
            setResult({
              success: true,
              action: isApproved ? 'approved' : 'rejected',
              message: isApproved ? 'Request has been approved successfully!' : 'Request has been rejected successfully!'
            });
          } else {
            setError('Unable to determine the action result.');
          }
        } else {
          const errorText = await response.text();
          
          if (response.status === 400) {
            if (errorText.includes('Invalid Token')) {
              setError('The token is invalid or malformed. Please use the original email link.');
            } else if (errorText.includes('Token Expired')) {
              setError('This approval/rejection link has expired. Please use the dashboard to take action.');
            } else if (errorText.includes('Already Processed')) {
              setError('This request has already been processed.');
            } else {
              setError('Bad request. Please check the link and try again.');
            }
          } else if (response.status === 404) {
            setError('The access request could not be found.');
          } else if (response.status === 500) {
            setError('Server error occurred. Please try again later.');
          } else {
            setError(`An error occurred: ${response.status}`);
          }
        }
      } catch (networkError) {
        console.error('Network error:', networkError);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    processEmailAction();
  }, [searchParams]);

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.6
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.3
      }
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 2
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card sx={{ maxWidth: 500, width: '100%', textAlign: 'center', p: 4 }}>
            <CardContent>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Processing Request...
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please wait while we process your email action.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card sx={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            {result && result.success ? (
              <>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={iconVariants}
                >
                  {result.action === 'approved' ? (
                    <CheckCircle 
                      sx={{ 
                        fontSize: 80, 
                        color: '#4CAF50', 
                        mb: 2 
                      }} 
                    />
                  ) : (
                    <Cancel 
                      sx={{ 
                        fontSize: 80, 
                        color: '#f44336', 
                        mb: 2 
                      }} 
                    />
                  )}
                </motion.div>
                
                <Typography 
                  variant="h4" 
                  gutterBottom 
                  sx={{ 
                    color: result.action === 'approved' ? '#4CAF50' : '#f44336',
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  Request {result.action === 'approved' ? 'Approved' : 'Rejected'}
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                  {result.message}
                </Typography>
                
                <Alert 
                  severity={result.action === 'approved' ? 'success' : 'info'} 
                  sx={{ mb: 3, textAlign: 'left' }}
                >
                  {result.action === 'approved' 
                    ? 'The applicant has been notified of the approval and can now proceed with their access request.'
                    : 'The applicant has been notified of the rejection. They may submit a new request if needed.'
                  }
                </Alert>
              </>
            ) : (
              <>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={iconVariants}
                >
                  <Error sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
                </motion.div>
                
                <Typography variant="h4" gutterBottom sx={{ color: '#f44336', fontWeight: 'bold', mb: 2 }}>
                  Action Failed
                </Typography>
                
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  {error || 'An unexpected error occurred while processing your request.'}
                </Alert>
              </>
            )}
            
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                mt: 2,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default EmailAction;
