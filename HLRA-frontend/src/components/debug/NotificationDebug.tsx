import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trash2, RefreshCw, Info } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { notify } from '../../utils/notifications';

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
}

const NotificationDebug: React.FC = () => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = () => {
    const newStats = notificationService.getNotificationStats();
    setStats(newStats);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleCleanupDuplicates = async () => {
    setIsLoading(true);
    try {
      const removedCount = notificationService.cleanupDuplicates();
      if (removedCount > 0) {
        notify.success('Cleanup Complete', `Removed ${removedCount} duplicate notifications`);
      } else {
        notify.info('No Duplicates Found', 'Your notifications are already clean');
      }
      refreshStats();
    } catch (error) {
      notify.error('Cleanup Failed', 'Unable to cleanup notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      notificationService.clearAllNotifications();
      notify.success('Notifications Cleared', 'All notifications have been removed');
      refreshStats();
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await notificationService.syncWithBackend();
      notify.success('Sync Complete', 'Notifications synced with backend');
      refreshStats();
    } catch (error) {
      notify.error('Sync Failed', 'Unable to sync with backend');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notification Debug</h1>
          <p className="text-gray-600">Manage and debug your notifications</p>
        </div>
        <Button onClick={refreshStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-600">
                {stats.unread} unread
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">By Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">
                    {type}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">By Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <div key={source} className="flex justify-between items-center">
                  <Badge 
                    variant={source === 'backend' ? 'default' : 'secondary'} 
                    className="text-xs"
                  >
                    {source}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Management</CardTitle>
          <CardDescription>
            Clean up duplicate notifications or sync with the backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleCleanupDuplicates} 
              disabled={isLoading}
              variant="default"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Duplicates
            </Button>

            <Button 
              onClick={handleSync} 
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync with Backend
            </Button>

            <Button 
              onClick={handleClearAll} 
              disabled={isLoading}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">About Notification Management:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Remove Duplicates:</strong> Safely removes duplicate notifications while preserving the latest version</li>
                  <li>• <strong>Sync with Backend:</strong> Fetches latest notifications from the server</li>
                  <li>• <strong>Clear All:</strong> Removes all notifications (cannot be undone)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDebug;