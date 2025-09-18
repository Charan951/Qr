import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Dashboard,
  CheckCircle,
  Cancel,
  Pending,
  Logout,
  Visibility,
  FilterList,
  Clear,
  People,
  Search,
  ThumbUp,
  ThumbDown,
  Message,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import ImageViewer from './ImageViewer';
import MessageCenter from './MessageCenter';
import { Badge } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl, buildApiUrl, API_ENDPOINTS } from '../config/api';

// Animation variants
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

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.5
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
    transition: { duration: 0.3 }
  }
};

const statsCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15
    }
  },
  hover: {
    scale: 1.05,
    y: -3,
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

const tableVariants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
      delay: 0.3
    }
  }
};

const dialogVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
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
    y: 50,
    transition: { duration: 0.2 }
  }
};

const HRDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: null,
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('hrToken');
    if (!token) {
      navigate('/hr/login');
      return;
    }

    fetchRequests();
    fetchStats();
    fetchUnreadCount();
  }, [navigate, filters, pagination.page, pagination.pageSize]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('hrToken');
      const params = {
        page: pagination.page + 1,
        limit: pagination.pageSize,
        ...filters,
        startDate: filters.startDate ? filters.startDate.format('YYYY-MM-DD') : undefined,
        endDate: filters.endDate ? filters.endDate.format('YYYY-MM-DD') : undefined,
      };

      const response = await axios.get(getApiUrl(API_ENDPOINTS.HR_REQUESTS), {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setRequests(response.data.data);
      setPagination(prev => ({ ...prev, total: response.data.pagination.totalRequests }));
      setStats(response.data.counts);
    } catch (error) {
      console.error('Error fetching requests:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Stats are now fetched with requests, so this function is no longer needed
    // but keeping it for compatibility
    try {
      // Stats are already set in fetchRequests
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('hrToken');
      const response = await axios.get('http://localhost:5000/api/messages/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hrToken');
    localStorage.removeItem('hrUser');
    navigate('/hr/login');
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleActionRequest = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setRejectionReason('');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'rejected' && !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Rejection reason is required' });
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('hrToken');
      const payload = {
        status: actionType,
        ...(actionType === 'rejected' && { rejectionReason: rejectionReason.trim() })
      };

      const response = await axios.patch(
        buildApiUrl(API_ENDPOINTS.HR_REQUESTS, selectedRequest._id),
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `Request ${actionType} successfully!` 
        });
        setActionDialogOpen(false);
        fetchRequests(); // Refresh the data
      }
    } catch (error) {
      console.error('Error updating request:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update request' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedRows.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one request' });
      return;
    }
    setBulkActionType(action);
    setBulkRejectionReason('');
    setBulkActionDialogOpen(true);
  };

  const handleConfirmBulkAction = async () => {
    if (!bulkActionType || selectedRows.length === 0) return;

    if (bulkActionType === 'rejected' && !bulkRejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Rejection reason is required for bulk rejection' });
      return;
    }

    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem('hrToken');
      const payload = {
        requestIds: selectedRows,
        status: bulkActionType,
        ...(bulkActionType === 'rejected' && { rejectionReason: bulkRejectionReason.trim() })
      };

      const response = await axios.patch(
        getApiUrl(API_ENDPOINTS.HR_REQUESTS_BULK),
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `${selectedRows.length} request(s) ${bulkActionType} successfully!` 
        });
        setBulkActionDialogOpen(false);
        setSelectedRows([]);
        fetchRequests(); // Refresh the data
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating requests:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update requests' 
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: null,
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <Pending /> },
      approved: { color: 'success', icon: <CheckCircle /> },
      rejected: { color: 'error', icon: <Cancel /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        label={status.toUpperCase()}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  const columns = [
    { field: 'requestId', headerName: 'Request ID', width: 130 },
    { field: 'fullName', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'purposeOfAccess', headerName: 'Purpose', width: 150 },
    { field: 'whomToMeet', headerName: 'Whom to Meet', width: 150 },
    {
      field: 'submittedDate',
      headerName: 'Submitted Date',
      width: 120,
      valueFormatter: (params) => dayjs(params.value).format('MMM DD, YYYY'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleViewRequest(params.row)}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          {params.row.status === 'pending' && (
            <>
              <Tooltip title="Approve Request">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleActionRequest(params.row, 'approved')}
                >
                  <ThumbUp />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject Request">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleActionRequest(params.row, 'rejected')}
                >
                  <ThumbDown />
                </IconButton>
              </Tooltip>
            </>
          )}
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box>
        {/* Header */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <People sx={{ mr: 2, fontSize: 32, color: 'secondary.main' }} />
              <Typography variant="h4" component="h1" color="secondary">
                HR Dashboard
              </Typography>
            </Box>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="outlined"
                startIcon={<Logout />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        <AnimatePresence>
          {message.text && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
                {message.text}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

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

      {currentView === 'dashboard' ? (
        <>
        {/* HR Action Notice */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>HR Actions Enabled:</strong> You can now approve or reject pending access requests directly from this dashboard.
            </Typography>
          </Alert>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                variants={statsCardVariants}
                whileHover="hover"
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Requests
                        </Typography>
                        <Typography variant="h4">
                          {stats.total || 0}
                        </Typography>
                      </Box>
                      <Dashboard sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                variants={statsCardVariants}
                whileHover="hover"
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Pending
                        </Typography>
                        <Typography variant="h4" color="warning.main">
                          {stats.pending || 0}
                        </Typography>
                      </Box>
                      <Pending sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                variants={statsCardVariants}
                whileHover="hover"
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Approved
                        </Typography>
                        <Typography variant="h4" color="success.main">
                          {stats.approved || 0}
                        </Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                variants={statsCardVariants}
                whileHover="hover"
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Rejected
                        </Typography>
                        <Typography variant="h4" color="error.main">
                          {stats.rejected || 0}
                        </Typography>
                      </Box>
                      <Cancel sx={{ fontSize: 40, color: 'error.main', opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              Filters
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
            <Grid item xs={12} sm={6} md={4}>
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
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search (Name/Email)"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <DatePicker
                label="Date Filter"
                value={filters.startDate}
                onChange={(newValue) => setFilters(prev => ({ ...prev, startDate: newValue }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Access Requests Management
            </Typography>
            {selectedRows.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleBulkAction('approved')}
                  startIcon={<ThumbUp />}
                >
                  Approve Selected ({selectedRows.length})
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleBulkAction('rejected')}
                  startIcon={<ThumbDown />}
                >
                  Reject Selected ({selectedRows.length})
                </Button>
              </Box>
            )}
          </Box>
          <DataGrid
            rows={requests}
            columns={columns}
            pageSize={pagination.pageSize}
            rowsPerPageOptions={[5, 10, 25]}
            pagination
            paginationMode="server"
            rowCount={pagination.total}
            page={pagination.page}
            onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
            onPageSizeChange={(newPageSize) => setPagination(prev => ({ ...prev, pageSize: newPageSize }))}
            getRowId={(row) => row._id}
            autoHeight
            checkboxSelection
            onSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
            selectionModel={selectedRows}
            disableSelectionOnClick
          />
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2}>
              {/* Always show request ID and status */}
              {selectedRequest.requestId && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Request ID:</Typography>
                  <Typography>{selectedRequest.requestId}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status:</Typography>
                {getStatusChip(selectedRequest.status)}
              </Grid>
              
              {/* Basic required fields - only show if filled */}
              {selectedRequest.fullName && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Name:</Typography>
                  <Typography>{selectedRequest.fullName}</Typography>
                </Grid>
              )}
              {selectedRequest.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Email:</Typography>
                  <Typography>{selectedRequest.email}</Typography>
                </Grid>
              )}
              {selectedRequest.phoneNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Phone:</Typography>
                  <Typography>{selectedRequest.phoneNumber}</Typography>
                </Grid>
              )}
              {selectedRequest.whomToMeet && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Whom to Meet:</Typography>
                  <Typography>{selectedRequest.whomToMeet}</Typography>
                </Grid>
              )}
              {selectedRequest.purposeOfAccess && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Purpose:</Typography>
                  <Typography>{selectedRequest.purposeOfAccess}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show reference fields only if they exist */}
              {selectedRequest.referenceName && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Reference Name:</Typography>
                  <Typography>{selectedRequest.referenceName}</Typography>
                </Grid>
              )}
              {selectedRequest.referencePhoneNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Reference Phone:</Typography>
                  <Typography>{selectedRequest.referencePhoneNumber}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show training fields only if they exist */}
              {selectedRequest.trainingName && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Training Name:</Typography>
                  <Typography>{selectedRequest.trainingName}</Typography>
                </Grid>
              )}
              {selectedRequest.trainerNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Trainer Number:</Typography>
                  <Typography>{selectedRequest.trainerNumber}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show department name for training and assignment */}
              {selectedRequest.departmentName && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Department Name:</Typography>
                  <Typography>{selectedRequest.departmentName}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show visitor description */}
              {selectedRequest.visitorDescription && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Visitor Description:</Typography>
                  <Typography>{selectedRequest.visitorDescription}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show client fields */}
              {selectedRequest.companyName && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Company Name:</Typography>
                  <Typography>{selectedRequest.companyName}</Typography>
                </Grid>
              )}
              {selectedRequest.clientMobileNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Client Mobile:</Typography>
                  <Typography>{selectedRequest.clientMobileNumber}</Typography>
                </Grid>
              )}
              
              {/* Always show submitted date */}
              {selectedRequest.submittedDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Submitted:</Typography>
                  <Typography>{dayjs(selectedRequest.submittedDate).format('MMMM D, YYYY')} {selectedRequest.submittedTime && `at ${selectedRequest.submittedTime}`}</Typography>
                </Grid>
              )}
              
              {/* Conditionally show optional fields */}
              {selectedRequest.additionalNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Additional Notes:</Typography>
                  <Typography>{selectedRequest.additionalNotes}</Typography>
                </Grid>
              )}
              {selectedRequest.reviewNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Review Notes:</Typography>
                  <Typography>{selectedRequest.reviewNotes}</Typography>
                </Grid>
              )}
              {selectedRequest.reviewedBy && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Reviewed By:</Typography>
                  <Typography>{selectedRequest.reviewedBy}</Typography>
                </Grid>
              )}
              
              {/* Images Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Images:</Typography>
                <ImageViewer requestId={selectedRequest._id} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedRequest && selectedRequest.status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ThumbUp />}
                onClick={() => handleActionRequest(selectedRequest, 'approved')}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<ThumbDown />}
                onClick={() => handleActionRequest(selectedRequest, 'rejected')}
              >
                Reject
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approved' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this request?
          </Typography>
          
          {selectedRequest && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">Request Details:</Typography>
              <Typography variant="body2">ID: {selectedRequest.requestId}</Typography>
              <Typography variant="body2">Name: {selectedRequest.fullName}</Typography>
              <Typography variant="body2">Purpose: {selectedRequest.purposeOfAccess}</Typography>
            </Box>
          )}

          {actionType === 'rejected' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approved' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : null}
          >
            {actionLoading ? 'Processing...' : `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {bulkActionType === 'approved' ? 'Bulk Approve Requests' : 'Bulk Reject Requests'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to {bulkActionType === 'approved' ? 'approve' : 'reject'} {selectedRows.length} selected request(s)?
          </Typography>
          
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2">Selected Requests: {selectedRows.length}</Typography>
            <Typography variant="body2">This action will be applied to all selected requests.</Typography>
          </Box>

          {bulkActionType === 'rejected' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason *"
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
              placeholder="Please provide a reason for bulk rejection..."
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)} disabled={bulkActionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={bulkActionType === 'approved' ? 'success' : 'error'}
            onClick={handleConfirmBulkAction}
            disabled={bulkActionLoading}
            startIcon={bulkActionLoading ? <CircularProgress size={16} /> : null}
          >
            {bulkActionLoading ? 'Processing...' : `Confirm Bulk ${bulkActionType === 'approved' ? 'Approval' : 'Rejection'}`}
          </Button>
        </DialogActions>
      </Dialog>
        </>
      ) : (
        <MessageCenter userRole="hr" onUnreadCountChange={fetchUnreadCount} />
      )}
    </Box>
    </motion.div>
  );
};

export default HRDashboard;