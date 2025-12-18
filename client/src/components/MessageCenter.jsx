import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  CheckCircle,
  Cancel,
  Delete,
  MarkEmailRead,
  Refresh,
  Close,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getApiUrl } from '../config/api';

dayjs.extend(relativeTime);

const MessageCenter = ({ userRole, onClose, onUnreadCountChange }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    isRead: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const getAuthToken = useCallback(() => {
    return userRole === 'admin' 
      ? localStorage.getItem('adminToken')
      : localStorage.getItem('hrToken');
  }, [userRole]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.isRead !== 'all' && { isRead: filters.isRead }),
      };

      const response = await axios.get(getApiUrl('/api/messages'), {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setMessages(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.totalMessages
        }));
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch messages'
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, pagination.page, pagination.limit, filters.type, filters.isRead]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(getApiUrl('/api/messages/unread-count'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [fetchMessages, fetchUnreadCount]);

  useEffect(() => {
    const markAllAsReadOnOpen = async () => {
      try {
        const token = getAuthToken();
        await axios.patch(getApiUrl('/api/messages/mark-all-read'), {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchMessages();
        await fetchUnreadCount();
        if (onUnreadCountChange) {
          onUnreadCountChange();
        }
      } catch (error) {
        console.error('Error auto-marking messages as read:', error);
      }
    };

    markAllAsReadOnOpen();
  }, [fetchMessages, fetchUnreadCount, getAuthToken, onUnreadCountChange]);

  const markAsRead = async (messageId) => {
    try {
      const token = getAuthToken();
      await axios.patch(getApiUrl(`/api/messages/${messageId}/read`), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      setMessage({
        type: 'error',
        text: 'Failed to mark message as read'
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.patch(getApiUrl('/api/messages/mark-all-read'), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true, readAt: new Date() })));
        setUnreadCount(0);
        setMessage({
          type: 'success',
          text: `${response.data.modifiedCount} messages marked as read`
        });
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to mark messages as read'
      });
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = getAuthToken();
      await axios.delete(getApiUrl(`/api/messages/${messageId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setMessage({ type: 'success', text: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete message'
      });
    }
  };

  const handleViewMessage = (msg) => {
    setSelectedMessage(msg);
    setViewDialogOpen(true);
    if (!msg.isRead) {
      markAsRead(msg._id);
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircle color="success" />;
      case 'rejection':
        return <Cancel color="error" />;
      default:
        return <Notifications color="primary" />;
    }
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'approval':
        return 'success';
      case 'rejection':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsActive color="primary" />
              </Badge>
              <Typography variant="h6">Message Center</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Mark all as read">
                <IconButton onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <MarkEmailRead />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchMessages}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {message.text && (
            <Alert 
              severity={message.type} 
              onClose={() => setMessage({ type: '', text: '' })}
              sx={{ mb: 2 }}
            >
              {message.text}
            </Alert>
          )}

          <Box display="flex" gap={2} mb={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="approval">Approvals</MenuItem>
                <MenuItem value="rejection">Rejections</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.isRead}
                label="Status"
                onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
              >
                <MenuItem value="all">All Messages</MenuItem>
                <MenuItem value="false">Unread</MenuItem>
                <MenuItem value="true">Read</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
              No messages found
            </Typography>
          ) : (
            <>
              <List>
                {messages.map((msg, index) => (
                  <React.Fragment key={msg._id}>
                    <ListItem
                      button
                      onClick={() => handleViewMessage(msg)}
                      sx={{
                        bgcolor: msg.isRead ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Box display="flex" alignItems="center" mr={2}>
                        {getMessageIcon(msg.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={msg.isRead ? 'normal' : 'bold'}
                            >
                              {msg.title}
                            </Typography>
                            <Chip 
                              label={msg.type} 
                              size="small" 
                              color={getMessageColor(msg.type)}
                              variant="outlined"
                            />
                            {msg.priority === 'high' && (
                              <Chip label="High" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {msg.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(msg.createdAt).fromNow()} • By {msg.actionBy} ({msg.actionByRole?.toUpperCase()})
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Delete">
                          <IconButton 
                            edge="end" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(msg._id);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < messages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={Math.ceil(pagination.total / pagination.limit)}
                  page={pagination.page}
                  onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {selectedMessage && getMessageIcon(selectedMessage.type)}
            <Typography variant="h6">
              {selectedMessage?.title}
            </Typography>
            <Chip 
              label={selectedMessage?.type} 
              size="small" 
              color={selectedMessage ? getMessageColor(selectedMessage.type) : 'default'}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMessage && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedMessage.message}
              </Typography>
              
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Action taken by: {selectedMessage.actionBy} ({selectedMessage.actionByRole?.toUpperCase()})
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Date: {dayjs(selectedMessage.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                </Typography>
                {selectedMessage.relatedUser && (
                  <Typography variant="subtitle2" color="text.secondary">
                    Related to: {selectedMessage.relatedUser}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageCenter;
