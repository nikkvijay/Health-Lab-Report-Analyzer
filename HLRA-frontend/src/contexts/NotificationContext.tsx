import React, { createContext, useContext, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  service: typeof notificationService;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Start syncing with backend
      notificationService.startBackendSync();

      // Setup monthly reminders for authenticated user
      notificationService.setupMonthlyReminders(user.id);

      // Only setup demo notifications in development or if user email contains 'demo'
      // And only if they haven't been created yet for this session
      const demoKey = `demo_notifications_created_${user.id}`;
      const shouldSetupDemo = (process.env.NODE_ENV === 'development' || user.email?.includes('demo'));
      const alreadyCreated = sessionStorage.getItem(demoKey);
      
      if (shouldSetupDemo && !alreadyCreated) {
        // Mark as created to prevent duplicates
        sessionStorage.setItem(demoKey, 'true');
        
        // Simulate some demo health alerts and trends (for demonstration)
        const setupDemoNotifications = () => {
          // Demo health parameter alerts
          setTimeout(() => {
            notificationService.healthParameterAlert(
              'Blood Glucose',
              '180 mg/dL',
              'high',
              'demo-report-1'
            );
          }, 5000);

          // Demo trend alert
          setTimeout(() => {
            notificationService.trendAlert(
              'Cholesterol',
              'declining',
              15
            );
          }, 10000);

          // Demo checkup reminder (if last checkup was more than 6 months ago)
          const lastCheckup = new Date();
          lastCheckup.setMonth(lastCheckup.getMonth() - 7); // 7 months ago
          setTimeout(() => {
            notificationService.checkupReminder(lastCheckup, 180); // 6 months = 180 days
          }, 15000);

          // Demo persistent abnormal parameter
          setTimeout(() => {
            notificationService.abnormalParameterTrend('Blood Pressure', 4);
          }, 20000);
        };
        
        setupDemoNotifications();
      }
    } else {
      // Clear demo flag when user logs out
      if (user) {
        sessionStorage.removeItem(`demo_notifications_created_${user.id}`);
      }
    }

    return () => {
      // Cleanup when user logs out or component unmounts
      notificationService.cleanup();
    };
  }, [isAuthenticated, user]);

  const contextValue: NotificationContextType = {
    service: notificationService,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};