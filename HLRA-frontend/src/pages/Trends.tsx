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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { healthAPI } from "@/api/index";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Download,
  Share,
  Lightbulb,
} from "lucide-react";

export default function TrendsPage() {
  const [selectedParameter, setSelectedParameter] = useState("glucose");
  const [dateRange, setDateRange] = useState("3months");
  const [trendData, setTrendData] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        // Call backend API for trend data
        try {
          const data = await healthAPI.getTrendData(
            selectedParameter,
            dateRange
          );
          setTrendData(data.chartData || []);
          setParameters(data.parameters || []);
          setInsights(data.insights || []);
        } catch (apiError) {
          console.warn("Trend data not available, using empty data:", apiError);
          // Fallback to empty data if API call fails
          setTrendData([]);
          setParameters([]);
          setInsights([]);
        }
      } catch (error) {
        console.error("Error fetching trend data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [selectedParameter, dateRange]);

  const getParameterInfo = () => {
    switch (selectedParameter) {
      case "glucose":
        return { name: "Glucose", unit: "mg/dL", normalRange: [70, 100] };
      case "cholesterol":
        return {
          name: "Total Cholesterol",
          unit: "mg/dL",
          normalRange: [0, 200],
        };
      default:
        return { name: "Glucose", unit: "mg/dL", normalRange: [70, 100] };
    }
  };

  const parameterInfo = getParameterInfo();

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="text-center">Loading trends...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Health Trends</h1>
          <p className="text-slate-600">
            Track your health parameters over time and get AI-powered insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Parameter Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Parameter
                </label>
                <Select
                  value={selectedParameter}
                  onValueChange={setSelectedParameter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glucose">Glucose</SelectItem>
                    <SelectItem value="cholesterol">
                      Total Cholesterol
                    </SelectItem>
                    <SelectItem value="hdl">HDL Cholesterol</SelectItem>
                    <SelectItem value="ldl">LDL Cholesterol</SelectItem>
                    <SelectItem value="triglycerides">Triglycerides</SelectItem>
                    <SelectItem value="hemoglobin">Hemoglobin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Date Range
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{parameterInfo.name} Trend</span>
              <Badge variant="outline">{parameterInfo.unit}</Badge>
            </CardTitle>
            <CardDescription>
              Track your {parameterInfo.name.toLowerCase()} levels over time
              with normal range indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold mb-2">
                    No trend data available
                  </h3>
                  <p>Upload more reports to see your health trends over time</p>
                </div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                      formatter={(value: any) => [
                        `${value} ${parameterInfo.unit}`,
                        parameterInfo.name,
                      ]}
                    />
                    {parameterInfo.normalRange[0] > 0 && (
                      <ReferenceLine
                        y={parameterInfo.normalRange[0]}
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        label={{
                          value: "Normal Min",
                          position: "insideTopRight",
                        }}
                      />
                    )}
                    <ReferenceLine
                      y={parameterInfo.normalRange[1]}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      label={{
                        value: "Normal Max",
                        position: "insideTopRight",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parameter Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parameter Summary</CardTitle>
              <CardDescription>Latest values and trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parameters.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No parameter data available</p>
                </div>
              ) : (
                parameters.map((param: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border
  border-slate-200"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        {param.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          {param.current} {param.unit}
                        </span>
                        <Badge>{param.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Range: {param.range}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1">
                        {param.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(param.change)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">vs last reading</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Health Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI Health Insights</CardTitle>
              <CardDescription>
                Personalized recommendations based on your trends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>No insights available yet</p>
                  <p className="text-xs">
                    Upload more reports to get personalized insights
                  </p>
                </div>
              ) : (
                insights.map((insight: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${insight.bgColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <insight.icon
                        className={`h-5 w-5 mt-0.5 ${insight.color}`}
                      />
                      <div className="space-y-1">
                        <h4 className="font-medium text-slate-900">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
