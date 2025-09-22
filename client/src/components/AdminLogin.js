import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  AdminPanelSettings,
  Visibility,
  VisibilityOff,
  Login,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

// Animation variants
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    scale: 0.9,
    rotateX: -15
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: { duration: 0.3 }
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
  },
  hover: {
    scale: 1.2,
    rotate: 10,
    transition: { duration: 0.2 }
  }
};

const inputVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  focus: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, delay: 0.4 }
  },
  hover: {
    scale: 1.05,
    y: -2,
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

const alertVariants = {
  hidden: { 
    opacity: 0, 
    y: -20, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(getApiUrl(API_ENDPOINTS.ADMIN_LOGIN), {
        ...formData,
        role: 'admin'
      });

      // Store token and user info
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUser', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/admin/dashboard');

    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        px: { xs: 2, sm: 0 }
      }}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card sx={{ 
            maxWidth: 400, 
            width: '100%',
            mx: { xs: 2, sm: 0 }
          }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <motion.img 
                        src={process.env.PUBLIC_URL + "/logo.png"}
                        alt="Speshway Solutions Logo" 
                        style={{ width: '32px', height: '32px', marginRight: '8px' }}
                        variants={iconVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                      />
                    <motion.div
                      variants={iconVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <AdminPanelSettings sx={{ fontSize: { xs: 40, sm: 48 }, color: 'primary.main' }} />
                    </motion.div>
                  </Box>
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Typography 
                      variant="h4" 
                      component="h1" 
                      color="primary" 
                      textAlign="center"
                      sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
                    >
                      Admin Login
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      textAlign="center" 
                      sx={{ 
                        mt: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Speshway Solutions Private Limited
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      textAlign="center" 
                      sx={{ 
                        mt: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Access the administrative dashboard
                    </Typography>
                  </motion.div>
                </Box>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      variants={alertVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    whileFocus="focus"
                  >
                    <TextField
                      fullWidth
                      label="Username"
                      required
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      variant="outlined"
                      sx={{ mb: 3 }}
                      autoComplete="username"
                    />
                  </motion.div>

                  <motion.div
                    variants={inputVariants}
                    initial="hidden"
                    animate="visible"
                    whileFocus="focus"
                  >
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      variant="outlined"
                      sx={{ mb: 3 }}
                      autoComplete="current-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={togglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </motion.div>

                  <motion.div
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Login />}
                      sx={{ mb: 2 }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default AdminLogin;