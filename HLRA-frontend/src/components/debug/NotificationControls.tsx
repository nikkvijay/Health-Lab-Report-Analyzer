import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { notificationService } from '../../services/notificationService';
import { notify } from '../../utils/notifications';

const NotificationControls: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current settings
    const currentSettings = notificationService.getNotificationSettingsForUI();
    setSettings(currentSettings);
  }, []);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.updateNotificationSettings(newSettings);
  };

  const updateDurationSetting = (type: string, value: number) => {
    const newSettings = {
      ...settings,
      toastDuration: {
        ...settings.toastDuration,
        [type]: value
      }
    };
    setSettings(newSettings);
    notificationService.updateNotificationSettings(newSettings);
  };

  const testNotification = () => {
    notify.info('Test Notification', 'This is how notifications will appear with your current settings');
  };

  const turnOffMostNotifications = () => {
    const quietSettings = {
      ...settings,
      healthAlerts: false,
      reminders: false,
      systemNotifications: false,
      trends: false,
      appointments: false,
      medications: false,
      achievements: false,
      hydration: false,
      exercise: false,
      seasonal: false,
      educational: false,
      milestones: false,
      predictions: false,
    };
    setSettings(quietSettings);
    notificationService.updateNotificationSettings(quietSettings);
    notify.success('Quiet Mode Enabled', 'Most notifications have been disabled');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔔 Notification Settings</CardTitle>
          <CardDescription>
            Control which notifications you receive and how long they appear
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button onClick={testNotification} variant="outline" size="sm">
              Test Notification
            </Button>
            <Button onClick={turnOffMostNotifications} variant="outline" size="sm">
              🔇 Enable Quiet Mode
            </Button>
          </div>

          {/* Core Notifications (Always important) */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-green-600">✅ Essential (Always enabled)</h4>
            <div className="grid grid-cols-2 gap-4 opacity-75">
              <div className="flex items-center space-x-2">
                <Switch checked={true} disabled />
                <Label className="text-sm">Report Processing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={true} disabled />
                <Label className="text-sm">Critical Health Alerts</Label>
              </div>
            </div>
          </div>

          {/* Optional Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-blue-600">⚙️ Optional</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.healthAlerts || false}
                  onCheckedChange={(checked) => updateSetting('healthAlerts', checked)}
                />
                <Label className="text-sm">Health Alerts</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.reminders || false}
                  onCheckedChange={(checked) => updateSetting('reminders', checked)}
                />
                <Label className="text-sm">Reminders</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.trends || false}
                  onCheckedChange={(checked) => updateSetting('trends', checked)}
                />
                <Label className="text-sm">Health Trends</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.achievements || false}
                  onCheckedChange={(checked) => updateSetting('achievements', checked)}
                />
                <Label className="text-sm">Achievements</Label>
              </div>
            </div>
          </div>

          {/* Lifestyle Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-amber-600">🏃‍♂️ Lifestyle</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.medications || false}
                  onCheckedChange={(checked) => updateSetting('medications', checked)}
                />
                <Label className="text-sm">Medication Reminders</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.hydration || false}
                  onCheckedChange={(checked) => updateSetting('hydration', checked)}
                />
                <Label className="text-sm">Hydration Reminders</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.exercise || false}
                  onCheckedChange={(checked) => updateSetting('exercise', checked)}
                />
                <Label className="text-sm">Exercise Reminders</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.appointments || false}
                  onCheckedChange={(checked) => updateSetting('appointments', checked)}
                />
                <Label className="text-sm">Appointment Reminders</Label>
              </div>
            </div>
          </div>

          {/* Notification Duration Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">⏱️ Display Duration</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Success messages: {settings.toastDuration?.success || 3000}ms</Label>
                <input
                  type="range"
                  min="1000"
                  max="8000"
                  step="500"
                  value={settings.toastDuration?.success || 3000}
                  onChange={(e) => updateDurationSetting('success', parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              
              <div>
                <Label className="text-sm">Info messages: {settings.toastDuration?.info || 2000}ms</Label>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="500"
                  value={settings.toastDuration?.info || 2000}
                  onChange={(e) => updateDurationSetting('info', parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Recommendation:</p>
              <p>For the least interruption, keep only "Essential" notifications enabled and set durations to 2-3 seconds.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationControls;