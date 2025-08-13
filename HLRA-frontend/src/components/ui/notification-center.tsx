import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Upload, Calendar } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { notificationService } from '../../services/notificationService';
import { formatDate } from '../../utils/dateUtils';

interface NotificationData {
  id: string;
  type: 'report_processing' | 'health_alert' | 'reminder' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    });

    // Initial load
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Add slight delay to prevent immediate closing
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, onClose]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_processing':
        return <Upload className="h-4 w-4" />;
      case 'health_alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'reminder':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'report_processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'health_alert':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'reminder':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDelete = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div 
        ref={notificationRef}
        className="fixed right-4 top-4 w-96 max-h-[80vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Action buttons */}
          {notifications.length > 0 && (
            <div className="flex gap-2 mt-3">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">We'll notify you about important health updates</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            {formatDate(new Date(notification.timestamp))}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Delete notification"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Additional data display */}
                      {notification.data && (
                        <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                          {notification.type === 'health_alert' && notification.data.parameter && (
                            <span className="font-medium">
                              {notification.data.parameter}: {notification.data.value} ({notification.data.status})
                            </span>
                          )}
                          {notification.type === 'report_processing' && notification.data.parametersFound && (
                            <span>
                              Found {notification.data.parametersFound} health parameters
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;