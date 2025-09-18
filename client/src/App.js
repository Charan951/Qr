import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import AccessRequestForm from './components/AccessRequestForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import HRLogin from './components/HRLogin';
import HRDashboard from './components/HRDashboard';

import Layout from './components/Layout';

// Create Material UI theme with mobile responsiveness and animations
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      '@media (max-width:768px)': {
        fontSize: '2rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      '@media (max-width:768px)': {
        fontSize: '1.75rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      '@media (max-width:768px)': {
        fontSize: '1.5rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.25rem',
      },
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      '@media (max-width:768px)': {
        fontSize: '1.25rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.125rem',
      },
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      '@media (max-width:768px)': {
        fontSize: '1.125rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1rem',
      },
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
      '@media (max-width:480px)': {
        fontSize: '0.9rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      '@media (max-width:768px)': {
        fontSize: '0.9rem',
      },
      '@media (max-width:480px)': {
        fontSize: '0.875rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      '@media (max-width:480px)': {
        fontSize: '0.8rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          minHeight: '48px',
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
            transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '@media (max-width:768px)': {
            fontSize: '0.9rem',
            padding: '12px 20px',
            minHeight: '44px',
          },
          '@media (max-width:480px)': {
            fontSize: '0.875rem',
            padding: '10px 16px',
            minHeight: '42px',
            borderRadius: 8,
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(0,0,0,0.05)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
          '@media (max-width:768px)': {
            borderRadius: 12,
            margin: '12px 8px',
          },
          '@media (max-width:480px)': {
            borderRadius: 8,
            margin: '8px 4px',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:768px)': {
            paddingLeft: '20px',
            paddingRight: '20px',
          },
          '@media (max-width:480px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.2)',
            },
          },
          '@media (max-width:768px)': {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
            '& .MuiInputBase-input': {
              fontSize: '16px',
              padding: '14px 16px',
            },
          },
          '@media (max-width:480px)': {
            '& .MuiInputBase-input': {
              fontSize: '16px',
              padding: '12px 14px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          '@media (max-width:768px)': {
            margin: '20px',
            width: 'calc(100% - 40px)',
            maxHeight: 'calc(100% - 40px)',
            borderRadius: 12,
          },
          '@media (max-width:480px)': {
            margin: '16px',
            width: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          '@media (max-width:768px)': {
            borderRadius: 8,
            '& .MuiTable-root': {
              minWidth: 'auto',
            },
            '& .MuiTableCell-root': {
              padding: '8px 12px',
              fontSize: '0.875rem',
            },
          },
          '@media (max-width:480px)': {
            '& .MuiTableCell-root': {
              padding: '6px 8px',
              fontSize: '0.8rem',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
  },
});

// Page transition animations
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <AccessRequestForm />
            </motion.div>
          } 
        />
        <Route 
          path="/form" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <AccessRequestForm />
            </motion.div>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/login" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <AdminLogin />
            </motion.div>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <AdminDashboard />
            </motion.div>
          } 
        />
        
        {/* HR Routes */}
        <Route 
          path="/hr/login" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <HRLogin />
            </motion.div>
          } 
        />
        <Route 
          path="/hr/dashboard" 
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <HRDashboard />
            </motion.div>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <Layout>
            <AnimatedRoutes />
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
