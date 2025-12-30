import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../Authentication/AuthProvider';
import { useWebSocket } from '../contexts/WebSocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function Notifications({ onClose }) {
  const { user } = useContext(AuthContext);
  const { socket, connected } = useWebSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      const response = await axios.get(`${API_BASE}/api/notifications/${user.uid}`);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 10 seconds (fallback if WebSocket not connected)
    const interval = connected ? null : setInterval(fetchNotifications, 10000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.uid, connected]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewNotification = (notification) => {
      // Add new notification to the list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast.success(notification.title, {
        description: notification.message,
        duration: 5000,
      });
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, connected]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        userId: user?.uid
      });
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API_BASE}/api/notifications/${notificationId}`, {
        data: { userId: user?.uid }
      });
      
      // Update local state
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      await Promise.all(
        unreadNotifications.map(n => markAsRead(n._id))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification) => {
    if (notification.jobId) {
      return `/My-Posted-Job-Details/${notification.jobId}`;
    }
    return '/applications';
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-base-200 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-xl font-bold text-base-content">Notifications</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 text-base-content opacity-70">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-error">{error}</p>
              <button className="btn btn-sm btn-primary mt-4" onClick={fetchNotifications}>
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <i className="far fa-bell text-6xl text-base-content opacity-30 mb-4"></i>
              <p className="text-base-content opacity-70">No notifications yet</p>
            </div>
          ) : (
            <>
              {/* Unread Notifications */}
              {unreadNotifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-base-content opacity-70 mb-3">
                    New ({unreadNotifications.length})
                  </h3>
                  <div className="space-y-2">
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        formatTime={formatTime}
                        getNotificationLink={getNotificationLink}
                        isUnread={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Read Notifications */}
              {readNotifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-base-content opacity-70 mb-3">
                    Earlier
                  </h3>
                  <div className="space-y-2">
                    {readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        formatTime={formatTime}
                        getNotificationLink={getNotificationLink}
                        isUnread={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onMarkAsRead, onDelete, formatTime, getNotificationLink, isUnread }) {
  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        isUnread
          ? 'bg-primary/10 border-primary/20 hover:bg-primary/20'
          : 'bg-base-100 border-base-300 hover:bg-base-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-semibold ${isUnread ? 'text-base-content' : 'text-base-content opacity-70'}`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${isUnread ? 'text-base-content' : 'text-base-content opacity-60'}`}>
                {notification.message}
              </p>
              <p className="text-xs text-base-content opacity-50 mt-2">
                {formatTime(notification.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isUnread && (
                <span className="w-2 h-2 bg-primary rounded-full"></span>
              )}
              <button
                className="btn btn-xs btn-ghost btn-circle"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification._id);
                }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
          {notification.jobId && (
            <Link
              to={getNotificationLink(notification)}
              onClick={handleClick}
              className="btn btn-sm btn-link mt-2 p-0 h-auto min-h-0"
            >
              View Job →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}


