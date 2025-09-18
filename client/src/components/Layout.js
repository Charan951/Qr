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
      <AppBar position="static" elevation={2}>
        <Toolbar>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img 
                src="/logo.png"
                alt="Speshway Solutions Logo" 
                style={{ width: '32px', height: '32px', marginRight: '12px' }}
              />
            <Typography variant="h6" component="div">
              Speshway Solutions Private Limited
            </Typography>
          </Box>
          
          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
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
          </Box>

          {/* Mobile Navigation */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
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
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'primary.main',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          © 2024 Access Request Management System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;