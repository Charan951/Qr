import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Dashboard,
  CheckCircle,
  Cancel,
  Pending,
  Download,
  Logout,
  Visibility,
  Edit,
  FilterList,
  Clear,
  People,
  Message,
} from '@mui/icons-material';
import { Badge } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import HRManagement from './HRManagement';
import ImageViewer from './ImageViewer';
import MessageCenter from './MessageCenter';
import { getApiUrl, buildApiUrl, API_ENDPOINTS } from '../config/api';





// Animation variants for micro-interactions and feedback
const microInteractionVariants = {
  tap: { scale: 0.95 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  focus: { scale: 1.02, boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.3)" }
};

const feedbackVariants = {
  success: {
    scale: [1, 1.1, 1],
    backgroundColor: ["#4caf50", "#66bb6a", "#4caf50"],
    transition: { duration: 0.6 }
  },
  error: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  },
  loading: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  }
};

const chipVariants = {
  approved: {
    scale: [1, 1.2, 1],
    backgroundColor: ["#4caf50", "#66bb6a", "#4caf50"],
    transition: { duration: 0.5 }
  },
  rejected: {
    scale: [1, 1.2, 1],
    backgroundColor: ["#f44336", "#ef5350", "#f44336"],
    transition: { duration: 0.5 }
  },
  pending: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.3, repeat: Infinity, repeatDelay: 2 }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -5,
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    transition: { duration: 0.3 }
  }
};

const buttonPulseVariants = {
  rest: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 3 }
  }
};

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'hr-management'
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    startDate: null,
    endDate: null,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  console.log('AdminDashboard render - requests:', requests);
  console.log('AdminDashboard render - requests length:', requests.length);

  useEffect(() => {
    console.log('AdminDashboard useEffect triggered');
    // Check authentication
    const token = localStorage.getItem('adminToken');
    console.log('Admin token check:', token ? 'Token found' : 'No token');
    if (!token) {
      console.log('No token, redirecting to login');
      navigate('/admin/login');
      return;
    }

    console.log('Calling fetchRequests and fetchStats');
    fetchRequests();
    fetchStats();
    fetchUnreadCount();
  }, [navigate, filters, pagination.page, pagination.pageSize]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      console.log('fetchRequests - Token check:', token ? 'Token exists' : 'No token found');
      console.log('fetchRequests - Token value:', token);
      
      const params = {
        page: pagination.page + 1,
        limit: pagination.pageSize,
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };
      console.log('fetchRequests - Request params:', params);

      const response = await axios.get(getApiUrl(API_ENDPOINTS.ADMIN_REQUESTS), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
        timeout: 10000, // 10 second timeout
      });

      console.log('fetchRequests - Response status:', response.status);
      console.log('fetchRequests - Response data:', response.data);
      console.log('fetchRequests - Requests array:', response.data.data);
      console.log('fetchRequests - First request:', response.data.data?.[0]);

      setRequests(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.totalRequests || 0,
      }));
    } catch (error) {
      console.error('fetchRequests - Error details:', error);
      console.error('fetchRequests - Error response:', error.response?.data);
      console.error('fetchRequests - Error status:', error.response?.status);
      
      if (error.code === 'ECONNABORTED') {
        setMessage({
          type: 'error',
          text: 'Request timeout. Please check your connection and try again.',
        });
      } else if (error.response?.status === 401) {
        handleLogout();
      } else if (error.response?.status >= 500) {
        setMessage({
          type: 'error',
          text: 'Server error. Please try again later.',
        });
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to fetch requests',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(getApiUrl(API_ENDPOINTS.ADMIN_STATS), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(getApiUrl('/api/messages/unread-count'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleReviewRequest = (request) => {
    setSelectedRequest(request);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleApproveReject = async (action) => {
    // Add loading state for better UX
    setMessage({ type: 'info', text: `Processing ${action}...` });
    
    try {
      const token = localStorage.getItem('adminToken');
      const requestData = { status: action };
      
      // Add rejection reason if rejecting - always required by backend
      if (action === 'rejected') {
        requestData.rejectionReason = reviewNotes.trim() || 'No specific reason provided';
      }
      
      // Use a timeout to ensure the request doesn't hang
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      await axios.patch(
        buildApiUrl(API_ENDPOINTS.ADMIN_REQUESTS, selectedRequest._id),
        requestData,
        { 
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      setMessage({
        type: 'success',
        text: `Request ${action}d successfully! Notifications are being sent in the background.`
      });

      setReviewDialogOpen(false);
      
      // Optimistically update the UI before refetching
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === selectedRequest._id 
            ? { ...req, status: action, approvedBy: 'You', approvedAt: new Date() }
            : req
        )
      );
      
      // Fetch updated data in the background
      setTimeout(() => {
        fetchRequests();
        fetchStats();
      }, 100);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setMessage({
          type: 'warning',
          text: `${action} request is taking longer than expected. Please check the status in a moment.`
        });
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || `Failed to ${action} request`
        });
      }
    }
  };

  const handleExportExcel = async (type, params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(buildApiUrl(API_ENDPOINTS.ADMIN_EXPORT, type), {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `access-requests-${type}-${dayjs().format('YYYY-MM-DD')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Excel file downloaded successfully!'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to export Excel file'
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: null,
      endDate: null,
    });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <Pending />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircle />, label: 'Approved' },
      rejected: { color: 'error', icon: <Cancel />, label: 'Rejected' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="filled"
      />
    );
  };

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
          <Dashboard sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" color="primary">
            Admin Dashboard
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Logout />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentView} onChange={(e, newValue) => {
          setCurrentView(newValue);
          // Refresh unread count when switching to messages tab
          if (newValue === 'messages') {
            setTimeout(() => fetchUnreadCount(), 500); // Small delay to allow MessageCenter to mark messages as read
          }
        }}>
          <Tab 
            label="Dashboard" 
            value="dashboard" 
            icon={<Dashboard />} 
            iconPosition="start"
          />
          <Tab 
            label="HR Management" 
            value="hr-management" 
            icon={<People />} 
            iconPosition="start"
          />
          <Tab 
            label="Messages" 
            value="messages" 
            icon={
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <Message />
              </Badge>
            } 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Conditional Content */}
      {currentView === 'dashboard' ? (
        <>
          {message.text && (
            <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          )}

      {/* Filters and Export */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              Filters & Export
            </Typography>
            <Button
              startIcon={<Clear />}
              onClick={clearFilters}
              size="small"
            >
              Clear Filters
            </Button>
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(newValue) => setFilters(prev => ({ ...prev, startDate: newValue }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(newValue) => setFilters(prev => ({ ...prev, endDate: newValue }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Download />}
                onClick={() => handleExportExcel('all')}
              >
                Export Excel
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requests Cards */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Access Requests
          </Typography>
          
          {requests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                No requests found
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {requests.map((request, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={request._id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-4px)',
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => handleViewRequest(request)}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Header with ID and Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          px: 2, 
                          py: 0.5, 
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}>
                          #{index + 1 + (pagination.page * pagination.pageSize)}
                        </Box>
                        {getStatusChip(request.status)}
                      </Box>
                      
                      {/* Name */}
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                        {request.fullName || 'N/A'}
                      </Typography>
                      
                      {/* Contact Info */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          color: 'text.secondary'
                        }}>
                          <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>📧</Box>
                          {request.email || 'N/A'}
                        </Typography>
                        
                        {request.phoneNumber && (
                          <Typography variant="body2" sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 1,
                            color: 'text.secondary'
                          }}>
                            <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>📱</Box>
                            {request.phoneNumber}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Purpose */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                          Purpose of Visit:
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {request.purposeOfAccess || 'N/A'}
                        </Typography>
                      </Box>
                      
                      {/* Meeting Info */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                          Meeting With:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {request.whomToMeet || 'N/A'}
                        </Typography>
                      </Box>
                      
                      {/* Submitted Date */}
                      <Typography variant="body2" sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        color: 'text.secondary',
                        mb: 3
                      }}>
                        <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>📅</Box>
                        {request.submittedDate ? dayjs(request.submittedDate).format('MMM D, YYYY') : 'N/A'}
                      </Typography>
                      
                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 'auto' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRequest(request);
                            }}
                            sx={{ 
                              bgcolor: 'primary.main', 
                              color: 'white',
                              width: 36,
                              height: 36,
                              '&:hover': { 
                                bgcolor: 'primary.dark',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'pending' && (
                          <Tooltip title="Review Request">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReviewRequest(request);
                              }}
                              sx={{ 
                                bgcolor: 'warning.main', 
                                color: 'white',
                                width: 36,
                                height: 36,
                                '&:hover': { 
                                  bgcolor: 'warning.dark',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* Pagination */}
          {requests.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.pageSize)}
                page={pagination.page + 1}
                onChange={(event, newPage) => setPagination(prev => ({ ...prev, page: newPage - 1 }))}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2}>
              {/* Always show basic required fields */}
              {selectedRequest.fullName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Name:</Typography>
                  <Typography>{selectedRequest.fullName}</Typography>
                </Grid>
              )}
              {selectedRequest.email && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Email:</Typography>
                  <Typography>{selectedRequest.email}</Typography>
                </Grid>
              )}
              {selectedRequest.phoneNumber && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Phone:</Typography>
                  <Typography>{selectedRequest.phoneNumber}</Typography>
                </Grid>
              )}
              {selectedRequest.purposeOfAccess && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Purpose:</Typography>
                  <Typography>{selectedRequest.purposeOfAccess}</Typography>
                </Grid>
              )}
              {selectedRequest.whomToMeet && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Whom to Meet:</Typography>
                  <Typography>{selectedRequest.whomToMeet}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show reference fields only if they exist */}
              {selectedRequest.referenceName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Reference Name:</Typography>
                  <Typography>{selectedRequest.referenceName}</Typography>
                </Grid>
              )}
              {selectedRequest.referencePhoneNumber && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Reference Phone:</Typography>
                  <Typography>{selectedRequest.referencePhoneNumber}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show training fields only if they exist */}
              {selectedRequest.trainingName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Training Name:</Typography>
                  <Typography>{selectedRequest.trainingName}</Typography>
                </Grid>
              )}
              {selectedRequest.trainerNumber && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Trainer Number:</Typography>
                  <Typography>{selectedRequest.trainerNumber}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show department name for training and assignment */}
              {selectedRequest.departmentName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Department Name:</Typography>
                  <Typography>{selectedRequest.departmentName}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show visitor description */}
              {selectedRequest.visitorDescription && (
                <Grid size={12}>
                  <Typography variant="subtitle2">Visitor Description:</Typography>
                  <Typography>{selectedRequest.visitorDescription}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show client fields */}
              {selectedRequest.companyName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Company Name:</Typography>
                  <Typography>{selectedRequest.companyName}</Typography>
                </Grid>
              )}
              {selectedRequest.clientMobileNumber && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Client Mobile:</Typography>
                  <Typography>{selectedRequest.clientMobileNumber}</Typography>
                </Grid>
              )}
              
              {/* Always show submitted date and status */}
              {selectedRequest.submittedDate && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2">Submitted Date:</Typography>
                  <Typography>{dayjs(selectedRequest.submittedDate).format('MMMM D, YYYY')}</Typography>
                </Grid>
              )}
              <Grid size={12}>
                <Typography variant="subtitle2">Status:</Typography>
                {getStatusChip(selectedRequest.status)}
              </Grid>
              
              {/* Conditionally show optional fields */}
              {selectedRequest.additionalNotes && (
                <Grid size={12}>
                  <Typography variant="subtitle2">Additional Notes:</Typography>
                  <Typography>{selectedRequest.additionalNotes}</Typography>
                </Grid>
              )}
              {selectedRequest.rejectionReason && (
                <Grid size={12}>
                  <Typography variant="subtitle2">Rejection Reason:</Typography>
                  <Typography>{selectedRequest.rejectionReason}</Typography>
                </Grid>
              )}
              
              {/* Images Section */}
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Images:</Typography>
                <ImageViewer requestId={selectedRequest._id} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Review Request Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Add any notes about your decision..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleApproveReject('rejected')}
            color="error"
            variant="outlined"
          >
            Reject
          </Button>
          <Button
            onClick={() => handleApproveReject('approved')}
            color="success"
            variant="contained"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
        </>
      ) : currentView === 'hr-management' ? (
        <HRManagement />
      ) : (
        <MessageCenter userRole="admin" onUnreadCountChange={fetchUnreadCount} />
      )}
    </Box>
  );
};

export default AdminDashboard;