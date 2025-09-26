import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  People,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import { getApiUrl, buildApiUrl, API_ENDPOINTS } from '../config/api';

const HRManagement = () => {
  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    isActive: true
  });

  useEffect(() => {
    fetchHRUsers();
  }, []);

  const fetchHRUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(getApiUrl(API_ENDPOINTS.ADMIN_HR_USERS), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHrUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching HR users:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch HR users'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditMode(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setEditMode(true);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      isActive: user.isActive
    });
    setDialogOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this HR user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(buildApiUrl(API_ENDPOINTS.ADMIN_HR_USERS, userId), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'HR user deleted successfully' });
        fetchHRUsers();
      }
    } catch (error) {
      console.error('Error deleting HR user:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete HR user'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!editMode && formData.password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long'
      });
      return;
    }
    
    if (editMode && formData.password.trim() && formData.password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long'
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      let response;

      if (editMode) {
        // Update user
        const updateData = {
          username: formData.username,
          email: formData.email,
          isActive: formData.isActive
        };
        
        // Only include password if it's provided
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }

        response = await axios.put(
          buildApiUrl(API_ENDPOINTS.ADMIN_HR_USERS, selectedUser._id),
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new user
        response = await axios.post(
          getApiUrl(API_ENDPOINTS.ADMIN_HR_USERS),
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: editMode ? 'HR user updated successfully' : 'HR user created successfully'
        });
        setDialogOpen(false);
        fetchHRUsers();
      }
    } catch (error) {
      console.error('Error saving HR user:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save HR user'
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const columns = [
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueFormatter: (params) => dayjs(params.value).format('MMM DD, YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              onClick={() => handleEditUser(params.row)}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton
              size="small"
              onClick={() => handleDeleteUser(params.row._id)}
              color="error"
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" color="primary">
            HR User Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateUser}
        >
          Add HR User
        </Button>
      </Box>

      {message.text && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }} 
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* HR Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            HR Users ({hrUsers.length})
          </Typography>
          <DataGrid
            rows={hrUsers}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25]}
            getRowId={(row) => row._id}
            autoHeight
            disableSelectionOnClick
          />
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit HR User' : 'Create New HR User'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Username"
              required
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label={editMode ? 'New Password (leave blank to keep current)' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              required={!editMode}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              sx={{ mb: 2 }}
              helperText={!editMode ? 'Password must be at least 6 characters long' : 'Leave blank to keep current password'}
              error={!editMode && formData.password.length > 0 && formData.password.length < 6}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="Active User"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default HRManagement;