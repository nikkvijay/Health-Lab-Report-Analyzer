import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useHealthData } from "@/contexts/HealthDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { healthAPI } from "@/api/index";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  FileOutput,
  Activity,
  FileHeart,
  TestTube,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { reports, setReports } = useHealthData();
  const [stats, setStats] = useState({
    totalReports: 0,
    thisMonth: 0,
    avgProcessing: "0s",
    healthAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get both reports and stats from API
        const [reportsData, statsData] = await Promise.all([
          healthAPI.getReports(),
          healthAPI.getDashboardStats().catch(() => {
            console.warn("Stats API not available, using fallback calculation");
            return null;
          }),
        ]);

        // Handle reports data safely
        let reportsArray = [];
        if (Array.isArray(reportsData)) {
          reportsArray = reportsData;
        } else if (reportsData && Array.isArray(reportsData.data)) {
          reportsArray = reportsData.data;
        } else {
          reportsArray = [];
        }

        setReports(reportsArray);

        // Use stats from API if available, otherwise calculate from reports
        if (statsData && statsData.success) {
          setStats({
            totalReports: statsData.total_reports || 0,
            thisMonth: statsData.this_month || 0,
            avgProcessing: statsData.avg_processing || "0s",
            healthAlerts: statsData.health_alerts || 0,
          });
        } else {
          // Fallback calculation from reports data
          const now = new Date();
          const thisMonth = reportsArray.filter((report: any) => {
            if (!report.upload_date) return false;
            const reportDate = new Date(report.upload_date);
            return (
              reportDate.getMonth() === now.getMonth() &&
              reportDate.getFullYear() === now.getFullYear()
            );
          }).length;

          const failedReports = reportsArray.filter(
            (report: any) =>
              report.status === "failed" ||
              report.processing_status === "failed"
          ).length;

          setStats({
            totalReports: reportsArray.length,
            thisMonth,
            avgProcessing: "2.4s",
            healthAlerts: failedReports,
          });
        }
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        setReports([]);
        setStats({
          totalReports: 0,
          thisMonth: 0,
          avgProcessing: "0s",
          healthAlerts: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setReports]);
  const statsData = [
    {
      title: "Lab Reports",
      value: stats.totalReports.toString(),
      change: "+12%",
      trend: "up",
      icon: FileHeart,
      description: "Total medical reports processed",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      priority: "normal",
    },
    {
      title: "Recent Tests",
      value: stats.thisMonth.toString(),
      change: "+23%",
      trend: "up",
      icon: TestTube,
      description: "Lab tests this month",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      priority: "normal",
    },
    {
      title: "Processing Time",
      value: stats.avgProcessing,
      change: "-15%",
      trend: "down",
      icon: Activity,
      description: "Average analysis time",
      color: "text-violet-700",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
      priority: "normal",
    },
    {
      title: "Clinical Alerts",
      value: stats.healthAlerts.toString(),
      change: "+2",
      trend: "up",
      icon: AlertTriangle,
      description: "Parameters requiring attention",
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      priority: stats.healthAlerts > 0 ? "high" : "normal",
    },
  ];

  const recentReports = reports.slice(0, 5); // Show latest 5 reports

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6 bg-background transition-colors duration-300">
        <div className="text-center bg-card text-card-foreground rounded-xl p-8 shadow-lg animate-pulse border border-border/50">
          <div className="medical-spinner mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 min-h-screen overflow-y-auto scrollbar-enhanced transition-colors duration-300">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
              {getGreeting()}, {user?.full_name?.split(" ")[0] || "User"}!
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Your comprehensive health data dashboard and clinical overview.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}

      {/* Clinical Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card
            key={index}
            className={`card-enhanced border-2 transition-all duration-300 hover:shadow-xl ${
              stat.priority === "high"
                ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg"
                : `${stat.borderColor} bg-gradient-to-br ${stat.bgColor} to-white`
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-parameter-label">{stat.title}</p>
                    {stat.priority === "high" && (
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className="text-3xl font-semibold font-mono tracking-wide text-blue-600 dark:text-blue-400">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-4 ${stat.bgColor} border ${stat.borderColor} shadow-md`}
                >
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                  )}
                  <span className="text-sm font-medium text-emerald-600">
                    {stat.change}
                  </span>
                </div>
                <div className="text-xs text-slate-400">vs last period</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Clinical Activity Log */}
        <Card className="lg:col-span-2 card-enhanced border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <HeartPulse className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Clinical Activity Log
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Recent lab reports and processing status with clinical
                  insights
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReports.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <FileHeart className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-slate-600 dark:text-slate-300">
                    No lab reports yet
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Upload your first medical report to begin clinical analysis
                  </p>
                </div>
              </div>
            ) : (
              recentReports.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="font-medium text-slate-900">
                        {report.original_filename}
                      </span>
                      <Badge
                        variant={
                          report.status === "completed"
                            ? "default"
                            : report.status === "processing"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          report.status === "completed"
                            ? "bg-green-600 text-white shadow-sm"
                            : report.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-600 text-white shadow-sm"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{formatDate(report.upload_date)}</span>
                      <span>{report.parameters?.length || 0} parameters</span>
                    </div>
                    {report.status === "processing" && (
                      <Progress value={75} className="h-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="transition-colors"
                      onClick={() => navigate("/reports")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Clinical Quick Actions */}
        <Card className="card-enhanced border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-medical-heading">
                  Clinical Actions
                </CardTitle>
                <CardDescription className="text-medical-note">
                  Essential healthcare management tools
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 btn-enhanced h-12"
              onClick={() => navigate("/upload")}
            >
              <TestTube className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Upload Lab Report</div>
                <div className="text-xs text-blue-100">
                  Add new test results
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 btn-enhanced h-12"
              onClick={() => navigate("/reports")}
            >
              <FileHeart className="mr-3 h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-slate-900">
                  Medical Records
                </div>
                <div className="text-xs text-slate-500">
                  View all lab reports
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-2 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-300 btn-enhanced h-12"
              onClick={() => navigate("/trends")}
            >
              <HeartPulse className="mr-3 h-5 w-5 text-emerald-600" />
              <div className="text-left">
                <div className="font-medium text-slate-900">Health Trends</div>
                <div className="text-xs text-slate-500">
                  Track progress over time
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-2 border-slate-200 hover:border-violet-200 hover:bg-violet-50 transition-all duration-300 btn-enhanced h-12"
            >
              <FileOutput className="mr-3 h-5 w-5 text-violet-600" />
              <div className="text-left">
                <div className="font-medium text-slate-900">
                  Export Clinical Data
                </div>
                <div className="text-xs text-slate-500">
                  Download reports & insights
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
