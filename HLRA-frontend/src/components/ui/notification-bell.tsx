import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import NotificationCenter from './notification-center';
import { notificationService } from '../../services/notificationService';

const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCenter, setShowCenter] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount());
    });

    // Initial load
    setUnreadCount(notificationService.getUnreadCount());

    return unsubscribe;
  }, []);

  const handleBellClick = () => {
    setShowCenter(!showCenter);
  };

  const handleCloseCenter = () => {
    setShowCenter(false);
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBellClick}
          className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-red-500 text-white border-2 border-white dark:border-slate-900 flex items-center justify-center p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
      
      <NotificationCenter 
        isOpen={showCenter}
        onClose={handleCloseCenter}
      />
    </>
  );
};

export default NotificationBell;