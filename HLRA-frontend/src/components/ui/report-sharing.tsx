import React, { useState, useEffect } from 'react';
import { Share2, Mail, Link2, Download, Users, Eye, EyeOff, Calendar, Clock, Copy, Check } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { Switch } from './switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { notificationService } from '../../services/notificationService';
import { notify } from '../../utils/notifications';
import { PUBLIC_APP_URL } from '@/constant';

interface ReportSharingProps {
  reportId: string;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SharedLink {
  id: string;
  url: string;
  accessLevel: 'view' | 'comment' | 'edit';
  expiresAt: Date | null;
  password?: string;
  accessCount: number;
  createdAt: Date;
  isActive: boolean;
}

interface SharedUser {
  id: string;
  email: string;
  name: string;
  accessLevel: 'view' | 'comment' | 'edit';
  sharedAt: Date;
  lastAccessed?: Date;
}

const ReportSharing: React.FC<ReportSharingProps> = ({ reportId, reportTitle, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'link' | 'email' | 'users'>('link');
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  
  // Link sharing state
  const [linkSettings, setLinkSettings] = useState({
    accessLevel: 'view' as 'view' | 'comment' | 'edit',
    requirePassword: false,
    password: '',
    expiresIn: 'never' as 'never' | '1day' | '1week' | '1month' | '3months',
    allowDownload: true,
    trackAccess: true
  });

  // Email sharing state
  const [emailSettings, setEmailSettings] = useState({
    recipients: '',
    accessLevel: 'view' as 'view' | 'comment' | 'edit',
    message: '',
    notifyOnAccess: true,
    expiresIn: '1month' as 'never' | '1day' | '1week' | '1month' | '3months'
  });

  useEffect(() => {
    if (isOpen) {
      loadSharedLinks();
      loadSharedUsers();
    }
  }, [isOpen, reportId]);

  const loadSharedLinks = async () => {
    try {
      const { API_CLIENT } = await import('../../api/index');
      const response = await API_CLIENT.get(`/sharing/reports/${reportId}/shares`);
      
      const links: SharedLink[] = response.data.shares.map((share: any) => ({
        id: share.id,
        url: `${PUBLIC_APP_URL}${share.url}`,
        accessLevel: share.access_level,
        expiresAt: share.expires_at ? new Date(share.expires_at) : null,
        accessCount: share.access_count,
        createdAt: new Date(share.created_at),
        isActive: share.is_active,
        password: undefined
      }));
      
      setSharedLinks(links);
    } catch (error) {
      console.error('Error loading shared links:', error);
      // Fall back to empty array if API fails
      setSharedLinks([]);
    }
  };

  const loadSharedUsers = async () => {
    // Mock data - replace with actual API call
    const mockUsers: SharedUser[] = [
      {
        id: '1',
        email: 'doctor@hospital.com',
        name: 'Dr. Sarah Johnson',
        accessLevel: 'view',
        sharedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: '2',
        email: 'nurse@clinic.com',
        name: 'Nurse Patricia',
        accessLevel: 'comment',
        sharedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      }
    ];
    setSharedUsers(mockUsers);
  };

  const generateShareLink = async () => {
    try {
      const { API_CLIENT } = await import('../../api/index');
      
      const shareData = {
        access_level: linkSettings.accessLevel,
        expires_in: linkSettings.expiresIn,
        password: linkSettings.requirePassword ? linkSettings.password : undefined
      };

      const response = await API_CLIENT.post(`/sharing/reports/${reportId}/share`, shareData);
      
      const newLink: SharedLink = {
        id: response.data.id,
        url: `${PUBLIC_APP_URL}${response.data.url}`,
        accessLevel: response.data.access_level,
        expiresAt: response.data.expires_at ? new Date(response.data.expires_at) : null,
        password: linkSettings.requirePassword ? linkSettings.password : undefined,
        accessCount: 0,
        createdAt: new Date(response.data.created_at),
        isActive: true
      };

      setSharedLinks([...sharedLinks, newLink]);
      
      notify.success('Share Link Generated', 'Link has been created and copied to clipboard');
      
      // Copy to clipboard
      await navigator.clipboard.writeText(newLink.url);
      setCopiedLinkId(newLink.id);
      setTimeout(() => setCopiedLinkId(null), 3000);

      // Reset form
      setLinkSettings({
        ...linkSettings,
        password: '',
        requirePassword: false
      });

    } catch (error: any) {
      console.error('Error generating share link:', error);
      notify.error('Failed to Generate Link', error.response?.data?.detail || 'Please try again');
    }
  };

  const shareViaEmail = async () => {
    try {
      const emails = emailSettings.recipients.split(',').map(e => e.trim()).filter(e => e);
      
      if (emails.length === 0) {
        notify.error('No Recipients', 'Please enter at least one email address');
        return;
      }

      // Mock API call - replace with actual implementation
      const newUsers: SharedUser[] = emails.map(email => ({
        id: Date.now().toString() + Math.random(),
        email,
        name: email.split('@')[0], // Extract name from email
        accessLevel: emailSettings.accessLevel,
        sharedAt: new Date()
      }));

      setSharedUsers([...sharedUsers, ...newUsers]);
      
      notify.success(
        'Report Shared Successfully',
        `Shared with ${emails.length} recipient${emails.length > 1 ? 's' : ''}`
      );

      // Reset form
      setEmailSettings({
        ...emailSettings,
        recipients: '',
        message: ''
      });

      // Log sharing action
      notificationService.addNotification({
        type: 'system',
        title: 'Report Shared',
        message: `"${reportTitle}" was shared with ${emails.length} recipient${emails.length > 1 ? 's' : ''}`
      });

    } catch (error) {
      notify.error('Failed to Share Report', 'Please try again');
    }
  };

  const copyLinkToClipboard = async (link: SharedLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 3000);
      notify.success('Link Copied', 'Share link copied to clipboard');
    } catch (error) {
      notify.error('Failed to Copy', 'Please copy the link manually');
    }
  };

  const revokeLink = async (linkId: string) => {
    try {
      const { API_CLIENT } = await import('../../api/index');
      await API_CLIENT.delete(`/sharing/shares/${linkId}`);
      
      setSharedLinks(sharedLinks.map(link => 
        link.id === linkId ? { ...link, isActive: false } : link
      ));
      notify.success('Link Revoked', 'Share link has been deactivated');
    } catch (error: any) {
      console.error('Error revoking link:', error);
      notify.error('Failed to Revoke', error.response?.data?.detail || 'Please try again');
    }
  };

  const removeUser = async (userId: string) => {
    try {
      setSharedUsers(sharedUsers.filter(user => user.id !== userId));
      notify.success('Access Removed', 'User access has been revoked');
    } catch (error) {
      notify.error('Failed to Remove User', 'Please try again');
    }
  };

  const updateUserAccess = async (userId: string, newAccessLevel: 'view' | 'comment' | 'edit') => {
    try {
      setSharedUsers(sharedUsers.map(user =>
        user.id === userId ? { ...user, accessLevel: newAccessLevel } : user
      ));
      notify.success('Access Updated', 'User permissions have been changed');
    } catch (error) {
      notify.error('Failed to Update Access', 'Please try again');
    }
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const getExpiryTime = (expiresIn: string) => {
    const times = {
      '1day': 24 * 60 * 60 * 1000,
      '1week': 7 * 24 * 60 * 60 * 1000,
      '1month': 30 * 24 * 60 * 60 * 1000,
      '3months': 90 * 24 * 60 * 60 * 1000
    };
    return times[expiresIn as keyof typeof times] || 0;
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'view': return <Eye className="h-4 w-4" />;
      case 'comment': return <Users className="h-4 w-4" />;
      case 'edit': return <Share2 className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Share Report</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{reportTitle}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              ✕
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mt-4">
            {[
              { id: 'link', label: 'Share Link', icon: Link2 },
              { id: 'email', label: 'Email Share', icon: Mail },
              { id: 'users', label: 'Manage Access', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          {activeTab === 'link' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Access Level</Label>
                  <Select value={linkSettings.accessLevel} onValueChange={(value: any) => setLinkSettings({...linkSettings, accessLevel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="comment">View & Comment</SelectItem>
                      <SelectItem value="edit">Full Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Expires</Label>
                  <Select value={linkSettings.expiresIn} onValueChange={(value: any) => setLinkSettings({...linkSettings, expiresIn: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="1day">1 Day</SelectItem>
                      <SelectItem value="1week">1 Week</SelectItem>
                      <SelectItem value="1month">1 Month</SelectItem>
                      <SelectItem value="3months">3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={linkSettings.requirePassword}
                    onCheckedChange={(checked) => setLinkSettings({...linkSettings, requirePassword: checked})}
                  />
                  <Label>Require Password</Label>
                </div>

                {linkSettings.requirePassword && (
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={linkSettings.password}
                      onChange={(e) => setLinkSettings({...linkSettings, password: e.target.value})}
                      placeholder="Enter password"
                    />
                  </div>
                )}

                <Button onClick={generateShareLink} className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Generate Share Link
                </Button>
              </div>

              {sharedLinks.length > 0 && (
                <div>
                  <Separator className="mb-4" />
                  <h4 className="font-medium mb-3">Active Links</h4>
                  <div className="space-y-3">
                    {sharedLinks.map(link => (
                      <Card key={link.id} className={`p-3 ${!link.isActive ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getAccessLevelIcon(link.accessLevel)}
                              <span className="text-sm font-medium capitalize">{link.accessLevel}</span>
                              <Badge variant={link.isActive ? "default" : "secondary"}>
                                {link.isActive ? 'Active' : 'Revoked'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{link.url}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                              <span>{link.accessCount} views</span>
                              <span>Created {formatRelativeTime(link.createdAt)}</span>
                              {link.expiresAt && (
                                <span>Expires {formatRelativeTime(link.expiresAt)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLinkToClipboard(link)}
                              className="h-8 w-8 p-0"
                            >
                              {copiedLinkId === link.id ? 
                                <Check className="h-4 w-4 text-green-600" /> :
                                <Copy className="h-4 w-4" />
                              }
                            </Button>
                            {link.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeLink(link.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <Label>Recipients</Label>
                <Input
                  value={emailSettings.recipients}
                  onChange={(e) => setEmailSettings({...emailSettings, recipients: e.target.value})}
                  placeholder="doctor@hospital.com, nurse@clinic.com"
                />
                <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
              </div>

              <div>
                <Label>Access Level</Label>
                <Select value={emailSettings.accessLevel} onValueChange={(value: any) => setEmailSettings({...emailSettings, accessLevel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="comment">View & Comment</SelectItem>
                    <SelectItem value="edit">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Message (Optional)</Label>
                <Textarea
                  value={emailSettings.message}
                  onChange={(e) => setEmailSettings({...emailSettings, message: e.target.value})}
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Access Expires</Label>
                <Select value={emailSettings.expiresIn} onValueChange={(value: any) => setEmailSettings({...emailSettings, expiresIn: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1day">1 Day</SelectItem>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={shareViaEmail} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Shared With</h4>
                <Badge variant="secondary">{sharedUsers.length} users</Badge>
              </div>

              {sharedUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No users have access to this report</p>
                  <p className="text-sm mt-1">Use the Email tab to share with others</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedUsers.map(user => (
                    <Card key={user.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">{user.name[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 ml-10">
                            <span>Shared {formatRelativeTime(user.sharedAt)}</span>
                            {user.lastAccessed && (
                              <span>Last accessed {formatRelativeTime(user.lastAccessed)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Select
                            value={user.accessLevel}
                            onValueChange={(value: any) => updateUserAccess(user.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">View</SelectItem>
                              <SelectItem value="comment">Comment</SelectItem>
                              <SelectItem value="edit">Edit</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUser(user.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportSharing;