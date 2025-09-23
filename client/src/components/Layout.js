import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  People,
  Home,
  Menu as MenuIcon,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

// Animation variants
const headerVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.6
    }
  }
};

const logoVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.2
    }
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

const mobileMenuVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: -20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: { duration: 0.2 }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <AppBar position="static" elevation={2}>
          <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <motion.img 
                  src={logo}
                  alt="Speshway Solutions Logo" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    marginRight: '12px',
                  }}
                  variants={logoVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                />
              <motion.div
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  SPESHWAY SOLUTIONS PRIVATE LIMITED
                </Typography>
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{
                    fontSize: '0.9rem',
                    display: { xs: 'block', sm: 'none' }
                  }}
                >
                  Speshway Solutions
                </Typography>
              </motion.div>
            </Box>
            
            {/* Desktop Navigation */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    color="inherit"
                    startIcon={<Home />}
                    onClick={() => navigate('/')}
                    sx={{
                      backgroundColor: isActive('/') || isActive('/form') ? 'rgba(255,255,255,0.1)' : 'transparent'
                    }}
                  >
                    Request Form
                  </Button>
                </motion.div>

                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    color="inherit"
                    startIcon={<AdminPanelSettings />}
                    onClick={() => navigate('/admin/login')}
                    sx={{
                      backgroundColor: location.pathname.startsWith('/admin') ? 'rgba(255,255,255,0.1)' : 'transparent'
                    }}
                  >
                    Admin
                  </Button>
                </motion.div>

                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    color="inherit"
                    startIcon={<People />}
                    onClick={() => navigate('/hr/login')}
                    sx={{
                       backgroundColor: location.pathname.startsWith('/hr') ? 'rgba(255,255,255,0.1)' : 'transparent'
                     }}
                   >
                     HR
                   </Button>
                 </motion.div>
               </Box>
             </motion.div>

             {/* Mobile Navigation */}
             <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
               <motion.div
                 variants={buttonVariants}
                 initial="hidden"
                 animate="visible"
                 whileHover="hover"
                 whileTap="tap"
               >
                 <IconButton
                   size="large"
                   edge="start"
                   color="inherit"
                   aria-label="menu"
                   onClick={handleMenuOpen}
                 >
                   <MenuIcon />
                 </IconButton>
               </motion.div>
               <AnimatePresence>
                 {Boolean(anchorEl) && (
                   <motion.div
                     variants={mobileMenuVariants}
                     initial="hidden"
                     animate="visible"
                     exit="exit"
                   >
                     <Menu
                       anchorEl={anchorEl}
                       open={Boolean(anchorEl)}
                       onClose={handleMenuClose}
                       anchorOrigin={{
                         vertical: 'bottom',
                         horizontal: 'right',
                       }}
                       transformOrigin={{
                         vertical: 'top',
                         horizontal: 'right',
                       }}
                     >
                       <MenuItem onClick={() => handleNavigation('/')}>
                         <Home sx={{ mr: 1 }} /> Request Form
                       </MenuItem>

                       <MenuItem onClick={() => handleNavigation('/admin/login')}>
                         <AdminPanelSettings sx={{ mr: 1 }} /> Admin
                       </MenuItem>
                       <MenuItem onClick={() => handleNavigation('/hr/login')}>
                         <People sx={{ mr: 1 }} /> HR
                       </MenuItem>
                     </Menu>
                   </motion.div>
                 )}
               </AnimatePresence>
             </Box>
           </Toolbar>
         </AppBar>
       </motion.div>

       <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
       >
         <Container 
           maxWidth="lg" 
           sx={{ 
             py: { xs: 2, sm: 4 },
             px: { xs: 1, sm: 3 }
        }}
      >
        {children}
      </Container>
      </motion.div>

      {/* Footer */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Box
          component="footer"
          sx={{
            py: { xs: 2, sm: 3 },
            px: 2,
            mt: 'auto',
          backgroundColor: 'primary.main',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="body2"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          © 2025 Access Request Management System. All rights reserved.
        </Typography>
      </Box>
      </motion.div>
    </Box>
  );
};

export default Layout;
