import { toast } from 'sonner';
import { notify } from '../utils/notifications';

interface NotificationData {
  id: string;
  type: 'report_processing' | 'health_alert' | 'reminder' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private subscribers: ((notifications: NotificationData[]) => void)[] = [];
  private reminderIntervals: NodeJS.Timeout[] = [];
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private requestCount: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT = 10; // Max 10 requests per minute per endpoint
  private readonly RATE_WINDOW = 60 * 1000; // 1 minute window

  constructor() {
    this.loadNotifications();
    this.setupPeriodicChecks();
    
    // Sync with backend notifications periodically
    this.syncWithBackend();
    setInterval(() => {
      this.syncWithBackend();
    }, 5 * 60 * 1000); // Sync every 5 minutes
  }

  // Load notifications from localStorage
  private loadNotifications() {
    try {
      const saved = localStorage.getItem('hlra_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Save notifications to localStorage
  private saveNotifications() {
    try {
      localStorage.setItem('hlra_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Subscribe to notification updates
  subscribe(callback: (notifications: NotificationData[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  // Add a new notification with deduplication and settings check
  private addNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) {
    // Check notification settings first
    const settings = this.getNotificationSettings();
    
    // Check if this type of notification is enabled
    if (!this.isNotificationTypeEnabled(notification.type, settings)) {
      return null;
    }
    
    // Create a unique hash for deduplication
    const notificationHash = this.createNotificationHash(notification);
    
    // Check if similar notification exists in last 2 hours (increased from 1 hour)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const duplicateExists = this.notifications.some(existing => 
      existing.timestamp > twoHoursAgo &&
      this.createNotificationHash(existing) === notificationHash
    );

    if (duplicateExists) {
      return null;
    }

    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.notifySubscribers();

    return newNotification;
  }

  // Create a hash for notification deduplication
  private createNotificationHash(notification: Partial<NotificationData>): string {
    const hashString = `${notification.type}-${notification.title}-${notification.message}`;
    return btoa(hashString).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Report Processing Notifications
  reportUploadStarted(filename: string, reportId: string) {
    const notification = this.addNotification({
      type: 'system',
      title: 'Report Upload Started',
      message: `${filename} is being uploaded and processed`,
      data: { reportId, filename, status: 'uploading', local: true } // Mark as local-only
    });

    notify.loading(`Uploading ${filename}...`, 'Processing will begin shortly');
    return notification;
  }

  reportProcessingComplete(filename: string, reportId: string, parametersFound: number) {
    // Only show toast notification - backend will create persistent notification
    notify.success(
      'Lab Report Processed Successfully! 🎉',
      `${filename} - Found ${parametersFound} health parameters`
    );

    // Backend will handle health alerts and persistent notifications
    return null;
  }

  reportProcessingFailed(filename: string, reportId: string, error?: string) {
    const notification = this.addNotification({
      type: 'report_processing',
      title: 'Report Processing Failed',
      message: `Failed to process ${filename}. ${error || 'Please try again or contact support.'}`,
      data: { reportId, filename, status: 'failed', error }
    });

    notify.error(
      'Report Processing Failed ❌',
      `${filename} could not be processed. ${error || 'Please try again.'}`
    );
    return notification;
  }

  // Health Alert Notifications (Backend will handle persistent alerts)
  healthParameterAlert(parameter: string, value: string, status: 'high' | 'low' | 'critical', reportId: string) {
    // Only show toast notification - backend creates persistent health alerts
    const alertEmoji = status === 'critical' ? '🚨' : status === 'high' ? '📈' : '📉';
    notify.warning(
      `${alertEmoji} Health Alert: ${parameter}`,
      `Level is ${status} (${value}) - Please consult your doctor`
    );
    return null; // Backend handles persistent notification
  }

  // Monthly Upload Reminder System
  setupMonthlyReminders(userId: string) {
    // Check every day at 9 AM for monthly reminders
    const checkInterval = setInterval(() => {
      this.checkMonthlyUploadReminder();
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.reminderIntervals.push(checkInterval);

    // Initial check
    this.checkMonthlyUploadReminder();
  }

  private async checkMonthlyUploadReminder() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDate = now.getDate();

    try {
      // Get user's upload history for current month
      const reports = await this.getUserReportsForMonth(currentMonth, currentYear);
      
      // Check if user has uploaded this month
      const hasUploadedThisMonth = reports.length > 0;
      
      // Reminder scenarios
      if (!hasUploadedThisMonth) {
        // No uploads this month
        if (currentDate >= 15) {
          this.monthlyUploadReminder(currentMonth, 'overdue');
        } else if (currentDate >= 7) {
          this.monthlyUploadReminder(currentMonth, 'gentle');
        }
      } else {
        // Has uploaded this month - check for follow-up reminders
        const lastUpload = new Date(reports[0].upload_date);
        const daysSinceLastUpload = Math.floor((now.getTime() - lastUpload.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastUpload >= 30) {
          this.followUpUploadReminder();
        }
      }

      // Next month reminder (last 3 days of month)
      const isEndOfMonth = this.isLastDaysOfMonth(now);
      if (isEndOfMonth && hasUploadedThisMonth) {
        this.nextMonthUploadReminder();
      }

    } catch (error) {
      console.error('Error checking monthly reminders:', error);
    }
  }

  private monthlyUploadReminder(month: number, urgency: 'gentle' | 'overdue') {
    const monthName = new Date(0, month).toLocaleString('default', { month: 'long' });
    const lastReminder = localStorage.getItem(`reminder_${month}_${urgency}`);
    const today = new Date().toDateString();

    // Don't send the same reminder twice in one day
    if (lastReminder === today) return;

    const message = urgency === 'overdue' 
      ? `You haven't uploaded any health reports this month (${monthName}). Regular monitoring is important for tracking your health trends.`
      : `Gentle reminder: Consider uploading your health reports for ${monthName} to keep your health tracking up to date.`;

    const notification = this.addNotification({
      type: 'reminder',
      title: urgency === 'overdue' ? 'Monthly Health Report Overdue' : 'Monthly Health Report Reminder',
      message,
      data: { month, urgency, type: 'monthly_upload' }
    });

    const emoji = urgency === 'overdue' ? '📋⏰' : '💙📋';
    notify.info(
      `${emoji} ${monthName} Health Report Reminder`,
      urgency === 'overdue' ? 'Upload your reports to stay on track' : 'Keep your health monitoring consistent'
    );

    localStorage.setItem(`reminder_${month}_${urgency}`, today);
    return notification;
  }

  private followUpUploadReminder() {
    const notification = this.addNotification({
      type: 'reminder',
      title: 'Follow-up Health Report Reminder',
      message: "It's been a while since your last upload. Consider adding your latest health reports to track your progress.",
      data: { type: 'followup_upload' }
    });

    notify.info(
      '📈 Follow-up Health Check',
      "Time for your next health report upload!"
    );
    return notification;
  }

  private nextMonthUploadReminder() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleString('default', { month: 'long' });

    const notification = this.addNotification({
      type: 'reminder',
      title: 'Next Month Health Planning',
      message: `Great job staying consistent with your health monitoring! Don't forget to upload your ${nextMonthName} reports when they're available.`,
      data: { type: 'next_month_planning' }
    });

    notify.info(
      '🎯 Next Month Planning',
      `Keep up the great work with ${nextMonthName} reports!`
    );
    return notification;
  }

  // Additional Health-Related Notifications
  trendAlert(parameter: string, trend: 'improving' | 'declining', changePercent: number) {
    const notification = this.addNotification({
      type: 'health_alert',
      title: `Health Trend Alert: ${parameter}`,
      message: `Your ${parameter} has been ${trend} by ${changePercent}% over the last 3 months.`,
      data: { parameter, trend, changePercent, type: 'trend_alert' }
    });

    const emoji = trend === 'improving' ? '📈✨' : '📉⚠️';
    const message = trend === 'improving' 
      ? `Great progress! Your ${parameter} is improving`
      : `Attention needed: Your ${parameter} trend requires monitoring`;

    notify.info(`${emoji} Health Trend Update`, message);
    return notification;
  }

  checkupReminder(lastCheckupDate: Date, recommendedInterval: number) {
    const daysSinceCheckup = Math.floor((Date.now() - lastCheckupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCheckup >= recommendedInterval) {
      const notification = this.addNotification({
        type: 'reminder',
        title: 'Health Checkup Reminder',
        message: `It's been ${daysSinceCheckup} days since your last checkup. Consider scheduling your next health examination.`,
        data: { lastCheckupDate, daysSinceCheckup, type: 'checkup_reminder' }
      });

      notify.info(
        '🏥 Checkup Reminder',
        `Time for your regular health examination`
      );
      return notification;
    }
  }

  abnormalParameterTrend(parameter: string, consecutiveAbnormal: number) {
    if (consecutiveAbnormal >= 3) {
      const notification = this.addNotification({
        type: 'health_alert',
        title: `Persistent Health Alert: ${parameter}`,
        message: `Your ${parameter} has been abnormal for ${consecutiveAbnormal} consecutive reports. Please consult your healthcare provider.`,
        data: { parameter, consecutiveAbnormal, type: 'persistent_abnormal' }
      });

      notify.warning(
        '🚨 Persistent Health Alert',
        `${parameter} needs medical attention - ${consecutiveAbnormal} consecutive abnormal readings`
      );
      return notification;
    }
  }

  // Rate limiting and caching utilities
  private isRateLimited(key: string): boolean {
    const now = Date.now();
    const count = this.requestCount.get(key) || 0;
    
    // Reset counter if window has passed
    const windowKey = `${key}_window`;
    const windowStart = this.requestCount.get(windowKey) || 0;
    
    if (now - windowStart > this.RATE_WINDOW) {
      this.requestCount.set(key, 0);
      this.requestCount.set(windowKey, now);
      return false;
    }
    
    return count >= this.RATE_LIMIT;
  }

  private incrementRequestCount(key: string): void {
    const count = this.requestCount.get(key) || 0;
    this.requestCount.set(key, count + 1);
    
    if (!this.requestCount.has(`${key}_window`)) {
      this.requestCount.set(`${key}_window`, Date.now());
    }
  }

  private getCachedData(key: string): any | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.requestCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(key: string, data: any): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Utility Methods
  private async getUserReportsForMonth(month: number, year: number): Promise<any[]> {
    const cacheKey = `reports_${month}_${year}`;
    const rateLimitKey = 'getUserReports';
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Check rate limiting
    if (this.isRateLimited(rateLimitKey)) {
      console.warn(`Rate limited for ${rateLimitKey}. Using empty array.`);
      return [];
    }
    
    // Use the proper API client with authentication
    try {
      // Increment request count
      this.incrementRequestCount(rateLimitKey);
      
      // Import API_CLIENT dynamically to avoid circular imports
      const { API_CLIENT } = await import('../api/index');
      
      // Get all reports and filter by month/year locally
      // since the backend API doesn't support month/year parameters
      const response = await API_CLIENT.get('/reports');
      
      let reports = [];
      
      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        reports = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        reports = response.data.data;
      } else {
        reports = [];
      }
      
      // Filter reports by month and year
      const filteredReports = reports.filter((report: any) => {
        if (!report.upload_date) return false;
        
        const reportDate = new Date(report.upload_date);
        return reportDate.getMonth() === month && reportDate.getFullYear() === year;
      });
      
      // Cache the result
      this.setCachedData(cacheKey, filteredReports);
      
      return filteredReports;
    } catch (error) {
      console.error('Error fetching user reports:', error);
      // Return empty array to prevent further errors in notification logic
      return [];
    }
  }

  private isLastDaysOfMonth(date: Date): boolean {
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() >= lastDayOfMonth - 3;
  }

  private async checkForHealthAlerts(reportId: string) {
    // Fetch the report and check for abnormal parameters
    try {
      const { API_CLIENT } = await import('../api/index');
      const response = await API_CLIENT.get(`/reports/${reportId}`);
      
      if (response.data && response.data.parameters) {
        response.data.parameters.forEach((param: any) => {
          if (['high', 'low', 'critical'].includes(param.status)) {
            this.healthParameterAlert(param.name, param.value, param.status, reportId);
          }
        });
      }
    } catch (error) {
      console.error('Error checking health alerts:', error);
      // Silently fail to prevent breaking the notification system
    }
  }

  // Public API Methods
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifySubscribers();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifySubscribers();
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifySubscribers();
  }

  clearAllNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.notifySubscribers();
  }

  getNotifications() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Setup periodic health checks
  private setupPeriodicChecks() {
    // Check for trends and patterns every week
    const weeklyCheck = setInterval(() => {
      this.performWeeklyHealthAnalysis();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    this.reminderIntervals.push(weeklyCheck);
  }

  private async performWeeklyHealthAnalysis() {
    // Analyze trends, check for patterns, send relevant notifications
    // This would integrate with your analytics/trends API
  }

  // Additional Notification Types
  
  // Medication Reminders
  medicationReminder(medicationName: string, dosage: string, frequency: string) {
    const notification = this.addNotification({
      type: 'reminder',
      title: 'Medication Reminder',
      message: `Time to take your ${medicationName} - ${dosage}. Frequency: ${frequency}`,
      data: { medicationName, dosage, frequency, type: 'medication' }
    });

    notify.info(
      '💊 Medication Reminder',
      `${medicationName} - ${dosage}`
    );
    return notification;
  }

  medicationRefillReminder(medicationName: string, daysRemaining: number) {
    const notification = this.addNotification({
      type: 'reminder',
      title: 'Medication Refill Needed',
      message: `Your ${medicationName} prescription expires in ${daysRemaining} days. Contact your pharmacy for a refill.`,
      data: { medicationName, daysRemaining, type: 'refill' }
    });

    notify.warning(
      '🏥 Refill Reminder',
      `${medicationName} - ${daysRemaining} days remaining`
    );
    return notification;
  }

  // Appointment Notifications
  appointmentReminder(doctorName: string, appointmentDate: Date, hoursUntil: number) {
    const notification = this.addNotification({
      type: 'reminder',
      title: 'Upcoming Appointment',
      message: `You have an appointment with Dr. ${doctorName} in ${hoursUntil} hours (${appointmentDate.toLocaleDateString()}).`,
      data: { doctorName, appointmentDate, hoursUntil, type: 'appointment' }
    });

    notify.info(
      '👩‍⚕️ Appointment Reminder',
      `Dr. ${doctorName} - ${hoursUntil}h`
    );
    return notification;
  }

  missedAppointmentFollowup(doctorName: string, appointmentDate: Date) {
    const notification = this.addNotification({
      type: 'health_alert',
      title: 'Missed Appointment Follow-up',
      message: `You missed your appointment with Dr. ${doctorName} on ${appointmentDate.toLocaleDateString()}. Please reschedule to maintain your health monitoring.`,
      data: { doctorName, appointmentDate, type: 'missed_appointment' }
    });

    notify.warning(
      '⚠️ Missed Appointment',
      `Please reschedule with Dr. ${doctorName}`
    );
    return notification;
  }

  // Seasonal Health Reminders
  seasonalHealthReminder(type: 'flu_shot' | 'allergy_season' | 'vitamin_d', season: string) {
    const messages = {
      flu_shot: `Flu season is approaching! Consider scheduling your annual flu vaccination.`,
      allergy_season: `${season} allergy season has started. Monitor your symptoms and keep your medications handy.`,
      vitamin_d: `During ${season}, consider monitoring your Vitamin D levels due to reduced sunlight exposure.`
    };

    const notification = this.addNotification({
      type: 'reminder',
      title: 'Seasonal Health Reminder',
      message: messages[type],
      data: { type: 'seasonal', subtype: type, season }
    });

    notify.info(
      '🌤️ Seasonal Health',
      messages[type]
    );
    return notification;
  }

  // Diet & Lifestyle Notifications
  hydrationReminder(dailyGoal: number, currentIntake: number) {
    const remaining = dailyGoal - currentIntake;
    if (remaining > 0) {
      const notification = this.addNotification({
        type: 'reminder',
        title: 'Hydration Reminder',
        message: `You still need ${remaining}ml of water to reach your daily goal of ${dailyGoal}ml.`,
        data: { dailyGoal, currentIntake, remaining, type: 'hydration' }
      });

      notify.info(
        '💧 Stay Hydrated',
        `${remaining}ml remaining today`
      );
      return notification;
    }
  }

  exerciseReminder(weeklyGoal: number, currentProgress: number) {
    const progressPercent = Math.round((currentProgress / weeklyGoal) * 100);
    
    if (progressPercent < 50) {
      const notification = this.addNotification({
        type: 'reminder',
        title: 'Exercise Reminder',
        message: `You're at ${progressPercent}% of your weekly exercise goal. Consider adding some physical activity to your routine.`,
        data: { weeklyGoal, currentProgress, progressPercent, type: 'exercise' }
      });

      notify.info(
        '🏃‍♂️ Exercise Reminder',
        `${progressPercent}% of weekly goal completed`
      );
      return notification;
    }
  }

  sleepQualityAlert(averageHours: number, quality: 'poor' | 'fair' | 'good' | 'excellent') {
    if (averageHours < 6 || quality === 'poor') {
      const notification = this.addNotification({
        type: 'health_alert',
        title: 'Sleep Quality Alert',
        message: `Your recent sleep pattern shows ${averageHours} average hours with ${quality} quality. Consider improving your sleep hygiene.`,
        data: { averageHours, quality, type: 'sleep_quality' }
      });

      notify.warning(
        '😴 Sleep Alert',
        `${averageHours}h average - ${quality} quality`
      );
      return notification;
    }
  }

  // Integration Notifications
  wearableSyncNotification(deviceName: string, lastSync: Date) {
    const daysSinceSync = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceSync >= 2) {
      const notification = this.addNotification({
        type: 'system',
        title: 'Device Sync Needed',
        message: `Your ${deviceName} hasn't synced in ${daysSinceSync} days. Please sync your device to keep your health data up to date.`,
        data: { deviceName, lastSync, daysSinceSync, type: 'device_sync' }
      });

      notify.info(
        '📱 Device Sync',
        `${deviceName} - ${daysSinceSync} days ago`
      );
      return notification;
    }
  }

  dataImportComplete(source: string, recordsProcessed: number) {
    const notification = this.addNotification({
      type: 'system',
      title: 'Data Import Complete',
      message: `Successfully imported ${recordsProcessed} health records from ${source}.`,
      data: { source, recordsProcessed, type: 'data_import' }
    });

    notify.success(
      '📥 Import Complete',
      `${recordsProcessed} records from ${source}`
    );
    return notification;
  }

  dataBackupReminder(lastBackupDate: Date) {
    const daysSinceBackup = Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceBackup >= 30) {
      const notification = this.addNotification({
        type: 'reminder',
        title: 'Data Backup Reminder',
        message: `It's been ${daysSinceBackup} days since your last backup. Consider backing up your health data for security.`,
        data: { lastBackupDate, daysSinceBackup, type: 'backup' }
      });

      notify.info(
        '💾 Backup Reminder',
        `Last backup: ${daysSinceBackup} days ago`
      );
      return notification;
    }
  }

  // Educational Notifications
  personalizedHealthTip(category: string, tip: string, relevance: string) {
    const notification = this.addNotification({
      type: 'system',
      title: `Health Tip: ${category}`,
      message: `${tip} (Personalized based on ${relevance})`,
      data: { category, tip, relevance, type: 'health_tip' }
    });

    notify.info(
      '💡 Health Tip',
      tip
    );
    return notification;
  }

  healthResearchAlert(topic: string, study: string, relevance: string) {
    const notification = this.addNotification({
      type: 'system',
      title: 'New Health Research',
      message: `New study on ${topic}: "${study}". This may be relevant to ${relevance}.`,
      data: { topic, study, relevance, type: 'research' }
    });

    notify.info(
      '🔬 Health Research',
      `New ${topic} study available`
    );
    return notification;
  }

  // Critical Health Alerts
  criticalHealthAlert(parameter: string, value: string, action: string) {
    const notification = this.addNotification({
      type: 'health_alert',
      title: 'CRITICAL HEALTH ALERT',
      message: `URGENT: Your ${parameter} is ${value}. ${action}`,
      data: { parameter, value, action, type: 'critical', priority: 'urgent' }
    });

    notify.error(
      '🚨 CRITICAL ALERT',
      `${parameter}: ${value} - ${action}`
    );
    return notification;
  }

  drugInteractionAlert(medication1: string, medication2: string, severity: 'mild' | 'moderate' | 'severe') {
    const notification = this.addNotification({
      type: 'health_alert',
      title: 'Drug Interaction Warning',
      message: `${severity.toUpperCase()} interaction detected between ${medication1} and ${medication2}. Consult your pharmacist or doctor.`,
      data: { medication1, medication2, severity, type: 'drug_interaction' }
    });

    const emoji = severity === 'severe' ? '🚨' : severity === 'moderate' ? '⚠️' : 'ℹ️';
    notify.warning(
      `${emoji} Drug Interaction`,
      `${medication1} + ${medication2} - ${severity}`
    );
    return notification;
  }

  // Progress Celebration
  healthMilestoneAchieved(milestone: string, description: string) {
    const notification = this.addNotification({
      type: 'system',
      title: 'Health Milestone Achieved!',
      message: `Congratulations! You've achieved: ${milestone}. ${description}`,
      data: { milestone, description, type: 'milestone' }
    });

    notify.success(
      '🎉 Milestone Achieved!',
      milestone
    );
    return notification;
  }

  healthImprovementCelebration(parameter: string, improvement: string) {
    const notification = this.addNotification({
      type: 'system',
      title: 'Health Improvement!',
      message: `Great news! Your ${parameter} has ${improvement}. Keep up the excellent work!`,
      data: { parameter, improvement, type: 'improvement' }
    });

    notify.success(
      '📈 Health Improvement!',
      `${parameter} ${improvement}`
    );
    return notification;
  }

  // Smart Predictions
  predictiveHealthAlert(parameter: string, trend: string, prediction: string) {
    const notification = this.addNotification({
      type: 'health_alert',
      title: 'Predictive Health Alert',
      message: `Based on your ${parameter} trend (${trend}), we predict: ${prediction}. Consider discussing with your healthcare provider.`,
      data: { parameter, trend, prediction, type: 'predictive' }
    });

    notify.warning(
      '🔮 Predictive Alert',
      `${parameter} trend: ${prediction}`
    );
    return notification;
  }

  healthRiskAssessment(riskFactor: string, level: 'low' | 'moderate' | 'high', recommendations: string) {
    const notification = this.addNotification({
      type: 'health_alert',
      title: `${level.toUpperCase()} Risk Assessment`,
      message: `Your ${riskFactor} risk level is ${level}. Recommendations: ${recommendations}`,
      data: { riskFactor, level, recommendations, type: 'risk_assessment' }
    });

    const emoji = level === 'high' ? '🔴' : level === 'moderate' ? '🟡' : '🟢';
    notify.info(
      `${emoji} Risk Assessment`,
      `${riskFactor}: ${level} risk`
    );
    return notification;
  }

  // Notification Settings Management
  private getNotificationSettings() {
    try {
      const saved = localStorage.getItem('hlra_notification_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    
    // Default settings (less aggressive)
    return {
      reportProcessing: true,
      healthAlerts: true,
      systemNotifications: false, // Disabled by default
      reminders: false, // Disabled by default 
      trends: false, // Disabled by default
      appointments: true,
      medications: true,
      criticalAlerts: true,
      achievements: false // Disabled by default
    };
  }

  private isNotificationTypeEnabled(type: string, settings: any): boolean {
    switch (type) {
      case 'report_processing':
        return settings.reportProcessing !== false;
      case 'health_alert':
        return settings.healthAlerts !== false;
      case 'reminder':
        return settings.reminders === true;
      case 'system':
        return settings.systemNotifications === true;
      default:
        return false; // Unknown types are disabled
    }
  }

  // Public method to update notification settings
  updateNotificationSettings(settings: any) {
    try {
      localStorage.setItem('hlra_notification_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Sync with backend notifications
  async syncWithBackend() {
    try {
      const { notificationAPI } = await import('../api/index');
      const backendNotifications: any = await notificationAPI.getNotifications();
      
      console.log('Backend notifications response:', backendNotifications);
      
      // Safely handle backend response - ensure it's an array
      let notificationsArray = [];
      if (Array.isArray(backendNotifications)) {
        notificationsArray = backendNotifications;
      } else if (backendNotifications && Array.isArray(backendNotifications.data)) {
        notificationsArray = backendNotifications.data;
      } else if (backendNotifications && Array.isArray(backendNotifications.notifications)) {
        notificationsArray = backendNotifications.notifications;
      } else if (backendNotifications && backendNotifications.items && Array.isArray(backendNotifications.items)) {
        notificationsArray = backendNotifications.items;
      } else {
        console.warn('Backend notifications response is not an array:', backendNotifications);
        notificationsArray = [];
      }
      
      // Additional safety check - ensure notificationsArray is still an array
      if (!Array.isArray(notificationsArray)) {
        console.warn('notificationsArray is not an array after processing:', notificationsArray);
        notificationsArray = [];
      }
      
      // Convert backend notifications to frontend format with additional safety checks
      const convertedNotifications = notificationsArray.map((backendNotif: any, index: number) => {
        try {
          if (!backendNotif || typeof backendNotif !== 'object') {
            console.warn('Invalid notification object at index', index, ':', backendNotif);
            return null;
          }
          
          return {
            id: backendNotif.id || `backend_${Date.now()}_${index}`,
            type: this.mapBackendNotificationType(backendNotif.type || 'system'),
            title: backendNotif.title || 'Notification',
            message: backendNotif.message || '',
            timestamp: backendNotif.created_at ? new Date(backendNotif.created_at) : new Date(),
            read: backendNotif.is_read ?? false,
            data: backendNotif.data || {}
          };
        } catch (notifError) {
          console.error('Error processing notification at index', index, ':', notifError, backendNotif);
          return null;
        }
      }).filter(notif => notif !== null); // Remove any null entries

      // Merge with existing local notifications (keep local-only ones like upload progress)
      const localOnlyNotifications = this.notifications.filter(n => 
        n.type === 'system' && n.data?.local === true
      );

      this.notifications = [...convertedNotifications, ...localOnlyNotifications];
      this.saveNotifications();
      this.notifySubscribers();
      
    } catch (error) {
      console.error('Failed to sync notifications with backend:', error);
      // Continue with local notifications if backend sync fails
    }
  }

  private mapBackendNotificationType(backendType: string): 'report_processing' | 'health_alert' | 'reminder' | 'system' {
    switch (backendType) {
      case 'info':
      case 'success':
      case 'warning':
      case 'error':
        return 'system';
      case 'health_alert':
        return 'health_alert';
      case 'reminder':
        return 'reminder';
      default:
        return 'system';
    }
  }

  // Cleanup method
  cleanup() {
    this.reminderIntervals.forEach(interval => clearInterval(interval));
    this.reminderIntervals = [];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;