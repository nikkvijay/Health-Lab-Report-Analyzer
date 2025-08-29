import React from 'react';
import NotificationControls from '../components/debug/NotificationControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const NotificationSettings: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔔 Notification Management</h1>
        <p className="text-gray-600">
          Take control of your notifications. By default, most notifications are now disabled 
          to reduce interruptions. Enable only what you need.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 Current Notification Sources</CardTitle>
            <CardDescription>
              Here are all the places notifications come from in the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-green-600 mb-2">✅ Essential (Always On)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Report upload/processing status</li>
                  <li>• Critical health alerts (urgent)</li>
                  <li>• System errors</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-600 mb-2">🔕 Optional (Disabled by Default)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Profile creation/switching</li>
                  <li>• Health parameter alerts</li>
                  <li>• Medication reminders</li>
                  <li>• Exercise/hydration reminders</li>
                  <li>• Health trend analysis</li>
                  <li>• Achievement celebrations</li>
                  <li>• Monthly upload reminders</li>
                  <li>• Educational health tips</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <NotificationControls />

        <Card>
          <CardHeader>
            <CardTitle>🎯 Recommendation for Minimal Interruption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Recommended "Quiet Mode" Settings:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Keep: Report Processing + Critical Alerts</li>
                <li>❌ Disable: All reminders, trends, achievements</li>
                <li>⏱️ Duration: 2-3 seconds for all notifications</li>
                <li>🔇 Result: 90% fewer notifications!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSettings;