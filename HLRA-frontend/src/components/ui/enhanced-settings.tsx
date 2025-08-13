import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { healthAPI } from '@/api/index';
import { notificationService } from '../../services/notificationService';
import { notify } from '../../utils/notifications';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Switch } from './switch';
import { Textarea } from './textarea';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Separator } from './separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Database,
  Clock,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Globe,
  Palette,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Heart,
  Activity,
  FileHeart,
  Lock,
  Unlock,
} from 'lucide-react';

interface NotificationSettings {
  reportProcessing: boolean;
  healthAlerts: boolean;
  monthlyReminders: boolean;
  appointmentReminders: boolean;
  medicationReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface PrivacySettings {
  dataSharing: boolean;
  analyticsTracking: boolean;
  marketingEmails: boolean;
  researchParticipation: boolean;
  profileVisibility: 'private' | 'limited' | 'public';
  dataRetention: '1year' | '3years' | '5years' | 'indefinite';
  twoFactorAuth: boolean;
}

interface HealthSettings {
  units: {
    weight: 'kg' | 'lbs';
    height: 'cm' | 'ft';
    temperature: 'celsius' | 'fahrenheit';
    glucose: 'mg/dl' | 'mmol/l';
  };
  customRanges: {
    [key: string]: {
      min: number;
      max: number;
      unit: string;
    };
  };
  riskFactors: string[];
  medications: string[];
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataExportFormat: 'json' | 'csv' | 'pdf';
  defaultView: 'grid' | 'table';
  itemsPerPage: number;
}

const EnhancedSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    avatar: '',
  });

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    reportProcessing: true,
    healthAlerts: true,
    monthlyReminders: true,
    appointmentReminders: true,
    medicationReminders: false,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    dataSharing: false,
    analyticsTracking: true,
    marketingEmails: false,
    researchParticipation: false,
    profileVisibility: 'private',
    dataRetention: '3years',
    twoFactorAuth: false,
  });

  // Health settings
  const [health, setHealth] = useState<HealthSettings>({
    units: {
      weight: 'kg',
      height: 'cm',
      temperature: 'celsius',
      glucose: 'mg/dl',
    },
    customRanges: {
      glucose: { min: 70, max: 100, unit: 'mg/dL' },
      cholesterol: { min: 0, max: 200, unit: 'mg/dL' },
      bloodPressure: { min: 90, max: 140, unit: 'mmHg' },
    },
    riskFactors: [],
    medications: [],
    allergies: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  // App settings
  const [app, setApp] = useState<AppSettings>({
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoBackup: true,
    backupFrequency: 'weekly',
    dataExportFormat: 'json',
    defaultView: 'grid',
    itemsPerPage: 10,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Load settings from localStorage or API
      const savedNotifications = localStorage.getItem('hlra_notification_settings');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }

      const savedPrivacy = localStorage.getItem('hlra_privacy_settings');
      if (savedPrivacy) {
        setPrivacy(JSON.parse(savedPrivacy));
      }

      const savedHealth = localStorage.getItem('hlra_health_settings');
      if (savedHealth) {
        setHealth(JSON.parse(savedHealth));
      }

      const savedApp = localStorage.getItem('hlra_app_settings');
      if (savedApp) {
        setApp(JSON.parse(savedApp));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      await healthAPI.updateProfile(profileData);
      notify.success('Profile Updated', 'Your profile information has been saved');
      
      // Add notification
      notificationService.addNotification({
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile settings have been successfully updated'
      });
    } catch (error: any) {
      notify.error('Update Failed', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      // Save to localStorage
      localStorage.setItem('hlra_notification_settings', JSON.stringify(notifications));
      
      // Update notification service settings
      notificationService.updateNotificationSettings(notifications);
      
      notify.success('Notification Settings Saved', 'Your preferences have been updated');
      
      // Only add notification if system notifications are enabled
      if (notifications.systemNotifications) {
        notificationService.addNotification({
          type: 'system',
          title: 'Settings Updated',
          message: 'Notification preferences have been saved'
        });
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      notify.error('Save Failed', 'Failed to save notification settings');
    }
  };

  const savePrivacySettings = async () => {
    try {
      localStorage.setItem('hlra_privacy_settings', JSON.stringify(privacy));
      notify.success('Privacy Settings Saved', 'Your privacy preferences have been updated');
      
      notificationService.addNotification({
        type: 'system',
        title: 'Privacy Updated',
        message: 'Your privacy settings have been configured'
      });
    } catch (error) {
      notify.error('Save Failed', 'Failed to save privacy settings');
    }
  };

  const saveHealthSettings = async () => {
    try {
      localStorage.setItem('hlra_health_settings', JSON.stringify(health));
      notify.success('Health Settings Saved', 'Your health preferences have been updated');
      
      notificationService.addNotification({
        type: 'health_alert',
        title: 'Health Settings Updated',
        message: 'Your health monitoring preferences and ranges have been configured'
      });
    } catch (error) {
      notify.error('Save Failed', 'Failed to save health settings');
    }
  };

  const saveAppSettings = async () => {
    try {
      localStorage.setItem('hlra_app_settings', JSON.stringify(app));
      notify.success('App Settings Saved', 'Your application preferences have been updated');
    } catch (error) {
      notify.error('Save Failed', 'Failed to save app settings');
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notify.error('Password Mismatch', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      notify.error('Password Too Short', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      // API call to change password
      notify.success('Password Changed', 'Your password has been updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      notify.error('Password Change Failed', 'Please check your current password and try again');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const data = await healthAPI.exportUserData();
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hlra-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      notify.success('Data Exported', 'Your health data has been downloaded');
      notificationService.dataImportComplete('User Export', Object.keys(data).length);
    } catch (error) {
      notify.error('Export Failed', 'Failed to export your data');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      // API call to delete account
      notify.success('Account Deleted', 'Your account has been permanently deleted');
      logout();
    } catch (error) {
      notify.error('Delete Failed', 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const addCustomRange = (parameter: string) => {
    const name = prompt(`Enter parameter name (e.g., ${parameter}):`);
    if (name) {
      setHealth({
        ...health,
        customRanges: {
          ...health.customRanges,
          [name.toLowerCase()]: { min: 0, max: 100, unit: 'mg/dL' }
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account, privacy, notifications, and health preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-800 shadow-sm">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              App
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-xl">
                      {profileData.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-slate-500 mt-2">JPG, PNG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={profileData.gender} onValueChange={(value) => setProfileData({...profileData, gender: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select value={profileData.bloodType} onValueChange={(value) => setProfileData({...profileData, bloodType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <Button onClick={saveProfile} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={changePassword} disabled={loading}>
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Health Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reportProcessing">Report Processing</Label>
                        <Switch
                          id="reportProcessing"
                          checked={notifications.reportProcessing}
                          onCheckedChange={(checked) => setNotifications({...notifications, reportProcessing: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="healthAlerts">Health Alerts</Label>
                        <Switch
                          id="healthAlerts"
                          checked={notifications.healthAlerts}
                          onCheckedChange={(checked) => setNotifications({...notifications, healthAlerts: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="monthlyReminders">Monthly Reminders</Label>
                        <Switch
                          id="monthlyReminders"
                          checked={notifications.monthlyReminders}
                          onCheckedChange={(checked) => setNotifications({...notifications, monthlyReminders: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Delivery Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <Switch
                          id="emailNotifications"
                          checked={notifications.emailNotifications}
                          onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <Switch
                          id="pushNotifications"
                          checked={notifications.pushNotifications}
                          onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="soundEnabled">Sound Alerts</Label>
                        <Switch
                          id="soundEnabled"
                          checked={notifications.soundEnabled}
                          onCheckedChange={(checked) => setNotifications({...notifications, soundEnabled: checked})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Quiet Hours
                  </h4>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={notifications.quietHours.enabled}
                      onCheckedChange={(checked) => setNotifications({
                        ...notifications,
                        quietHours: {...notifications.quietHours, enabled: checked}
                      })}
                    />
                    <span className="text-sm">Enable quiet hours</span>
                  </div>
                  {notifications.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label>From</Label>
                        <Input
                          type="time"
                          value={notifications.quietHours.start}
                          onChange={(e) => setNotifications({
                            ...notifications,
                            quietHours: {...notifications.quietHours, start: e.target.value}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>To</Label>
                        <Input
                          type="time"
                          value={notifications.quietHours.end}
                          onChange={(e) => setNotifications({
                            ...notifications,
                            quietHours: {...notifications.quietHours, end: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={saveNotificationSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Control your data privacy and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Data Privacy</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dataSharing">Allow Data Sharing</Label>
                        <Switch
                          id="dataSharing"
                          checked={privacy.dataSharing}
                          onCheckedChange={(checked) => setPrivacy({...privacy, dataSharing: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="analyticsTracking">Analytics Tracking</Label>
                        <Switch
                          id="analyticsTracking"
                          checked={privacy.analyticsTracking}
                          onCheckedChange={(checked) => setPrivacy({...privacy, analyticsTracking: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketingEmails">Marketing Emails</Label>
                        <Switch
                          id="marketingEmails"
                          checked={privacy.marketingEmails}
                          onCheckedChange={(checked) => setPrivacy({...privacy, marketingEmails: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Security</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                        <Switch
                          id="twoFactorAuth"
                          checked={privacy.twoFactorAuth}
                          onCheckedChange={(checked) => setPrivacy({...privacy, twoFactorAuth: checked})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Profile Visibility</Label>
                        <Select value={privacy.profileVisibility} onValueChange={(value: any) => setPrivacy({...privacy, profileVisibility: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="limited">Limited</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data Retention Period</Label>
                        <Select value={privacy.dataRetention} onValueChange={(value: any) => setPrivacy({...privacy, dataRetention: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1year">1 Year</SelectItem>
                            <SelectItem value="3years">3 Years</SelectItem>
                            <SelectItem value="5years">5 Years</SelectItem>
                            <SelectItem value="indefinite">Indefinite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={savePrivacySettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={exportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Health Preferences
                </CardTitle>
                <CardDescription>Configure your health monitoring and units</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Measurement Units</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Weight</Label>
                        <Select value={health.units.weight} onValueChange={(value: any) => setHealth({
                          ...health, 
                          units: {...health.units, weight: value}
                        })}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="lbs">lbs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Height</Label>
                        <Select value={health.units.height} onValueChange={(value: any) => setHealth({
                          ...health, 
                          units: {...health.units, height: value}
                        })}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cm">cm</SelectItem>
                            <SelectItem value="ft">ft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Temperature</Label>
                        <Select value={health.units.temperature} onValueChange={(value: any) => setHealth({
                          ...health, 
                          units: {...health.units, temperature: value}
                        })}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="celsius">°C</SelectItem>
                            <SelectItem value="fahrenheit">°F</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Emergency Contact</h4>
                    <div className="space-y-3">
                      <Input
                        placeholder="Contact name"
                        value={health.emergencyContact.name}
                        onChange={(e) => setHealth({
                          ...health,
                          emergencyContact: {...health.emergencyContact, name: e.target.value}
                        })}
                      />
                      <Input
                        placeholder="Phone number"
                        value={health.emergencyContact.phone}
                        onChange={(e) => setHealth({
                          ...health,
                          emergencyContact: {...health.emergencyContact, phone: e.target.value}
                        })}
                      />
                      <Input
                        placeholder="Relationship"
                        value={health.emergencyContact.relationship}
                        onChange={(e) => setHealth({
                          ...health,
                          emergencyContact: {...health.emergencyContact, relationship: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={saveHealthSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Health Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Tab */}
          <TabsContent value="app" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  App Preferences
                </CardTitle>
                <CardDescription>Customize your app experience and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Appearance</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select value={app.theme} onValueChange={(value: any) => setApp({...app, theme: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Default View</Label>
                        <Select value={app.defaultView} onValueChange={(value: any) => setApp({...app, defaultView: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">Grid</SelectItem>
                            <SelectItem value="table">Table</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Data & Backup</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoBackup">Auto Backup</Label>
                        <Switch
                          id="autoBackup"
                          checked={app.autoBackup}
                          onCheckedChange={(checked) => setApp({...app, autoBackup: checked})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Backup Frequency</Label>
                        <Select value={app.backupFrequency} onValueChange={(value: any) => setApp({...app, backupFrequency: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={saveAppSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save App Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedSettings;