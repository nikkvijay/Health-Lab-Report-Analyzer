import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, Download, Lock, Calendar, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { notify } from '../utils/notifications';
import { API_CLIENT } from '../api/index';

interface SharedReportData {
  id: string;
  title: string;
  uploadDate: string;
  parameters: Array<{
    name: string;
    value: string;
    unit: string;
    status: 'normal' | 'high' | 'low' | 'critical';
    reference_range: string;
  }>;
  ownerName: string;
  accessLevel: 'view' | 'comment' | 'edit';
  requiresPassword: boolean;
  expiresAt?: string;
}

const SharedReport: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (reportId && token) {
      loadSharedReport();
    } else {
      setError('Invalid share link - missing report ID or token');
      setLoading(false);
    }
  }, [reportId, token]);

  const loadSharedReport = async () => {
    try {
      setLoading(true);
      const response = await API_CLIENT.get(`/sharing/shared/reports/${reportId}`, {
        headers: {
          'Share-Token': token
        }
      });
      
      if (response.data.requiresPassword && !accessGranted) {
        setPasswordRequired(true);
        setLoading(false);
        return;
      }
      
      setReport(response.data);
      setAccessGranted(true);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading shared report:', error);
      
      if (error.response?.status === 401) {
        setError('This share link has expired or is no longer valid');
      } else if (error.response?.status === 403) {
        setPasswordRequired(true);
        setError('Incorrect password');
      } else if (error.response?.status === 404) {
        setError('Report not found or share link is invalid');
      } else {
        setError('Failed to load shared report. Please try again.');
      }
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    try {
      const response = await API_CLIENT.post(`/sharing/shared/reports/${reportId}/access`, {
        password
      }, {
        headers: {
          'Share-Token': token
        }
      });
      
      setReport(response.data);
      setAccessGranted(true);
      setPasswordRequired(false);
      setError(null);
      notify.success('Access Granted', 'You can now view the shared report');
    } catch (error: any) {
      setError('Incorrect password. Please try again.');
      console.error('Password verification failed:', error);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await API_CLIENT.get(`/sharing/shared/reports/${reportId}/download`, {
        headers: {
          'Share-Token': token
        },
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report?.title || 'lab-report'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      notify.success('Download Started', 'Report is being downloaded');
    } catch (error) {
      notify.error('Download Failed', 'Unable to download the report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading shared report...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !passwordRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={() => window.close()} variant="outline">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired && !accessGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Password Required</CardTitle>
            <p className="text-sm text-slate-600">
              This shared report is protected with a password
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitPassword()}
              />
            </div>
            <Button onClick={submitPassword} className="w-full" disabled={!password.trim()}>
              <Lock className="h-4 w-4 mr-2" />
              Access Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-600">No report data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Shared Lab Report</h1>
              <p className="text-slate-600 mt-1">
                Shared by {report.ownerName} • {new Date(report.uploadDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(report.accessLevel)}`}>
                <Eye className="h-3 w-3 mr-1" />
                {report.accessLevel}
              </Badge>
              {report.expiresAt && (
                <Badge variant="outline" className="text-amber-600">
                  <Calendar className="h-3 w-3 mr-1" />
                  Expires {new Date(report.expiresAt).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
          
          {report.accessLevel !== 'view' && (
            <Alert className="border-blue-200 bg-blue-50">
              <Eye className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You have {report.accessLevel} access to this report
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Report Title */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{report.title}</span>
              <Button onClick={downloadReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Lab Results</CardTitle>
            <p className="text-sm text-slate-600">
              {report.parameters.length} parameters analyzed
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {report.parameters.map((param, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{param.name}</span>
                      {getStatusIcon(param.status)}
                    </div>
                    <p className="text-sm text-slate-600">
                      Reference: {param.reference_range}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      {param.value} {param.unit}
                    </div>
                    <Badge className={getStatusColor(param.status)}>
                      {param.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            This report was shared securely through HLRA Health Lab Report Analyzer
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Visit <a href={window.location.origin} className="text-blue-600 hover:underline">HLRA</a> to manage your own health reports
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedReport;