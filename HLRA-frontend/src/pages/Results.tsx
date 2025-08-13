import React from "react";
import HealthDataTable from "../components/DataTable/HealthDataTable";
import { useHealthData } from "../contexts/HealthDataContext";
import {
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/dateUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const Results = () => {
  const { currentReport, setCurrentReport, reports } = useHealthData();

  // Auto-select latest report if no currentReport is set
  React.useEffect(() => {
    if (!currentReport && reports.length > 0) {
      const latestReport = {
        id: reports[0].id || Math.random().toString(),
        original_filename: reports[0].original_filename || "Unnamed Report",
        uploadDate: reports[0].upload_date
          ? new Date(reports[0].upload_date)
          : new Date(),
        parameters: reports[0].parameters || [],
        insights: reports[0].insights || [],
        fileUrl: reports[0].file_url,
      };
      setCurrentReport(latestReport);
    }
  }, [currentReport, reports, setCurrentReport]);

  const handleReportSelect = (reportId: string) => {
    const selectedBackendReport = reports.find((r) => r.id === reportId);
    if (selectedBackendReport) {
      const transformedReport = {
        id: selectedBackendReport.id,
        original_filename: selectedBackendReport.original_filename || "Unnamed Report",
        uploadDate: selectedBackendReport.upload_date
          ? new Date(selectedBackendReport.upload_date)
          : new Date(),
        parameters: selectedBackendReport.parameters || [],
        insights: selectedBackendReport.insights || [],
        fileUrl: selectedBackendReport.file_url,
      };
      setCurrentReport(transformedReport);
    }
  };

  if (!currentReport && reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No Reports Available
        </h2>
        <p className="text-gray-600 mb-6">
          Please upload a lab report to view results
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload Report
        </Link>
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading report...</p>
      </div>
    );
  }

  const report = currentReport;
  const abnormalCount = report.parameters.filter(
    (p) => p.status !== "normal"
  ).length;
  const criticalCount = report.parameters.filter(
    (p) => p.status === "critical"
  ).length;

  return (
    <div className="space-y-6">
      {/* Report Selector */}
      {reports.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Select Report:
              </label>
              <Select
                value={currentReport.id}
                onValueChange={handleReportSelect}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a report" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report: any) => (
                    <SelectItem key={report.id} value={report.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">
                          {report.original_filename || "Unnamed Report"}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDate(report.upload_date)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Results</h1>
          <p className="text-gray-600">Analysis of {report.original_filename}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(report.uploadDate)}</span>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Parameters
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {report.parameters.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Normal</p>
              <p className="text-2xl font-bold text-gray-900">
                {report.parameters.length - abnormalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abnormal</p>
              <p className="text-2xl font-bold text-gray-900">
                {abnormalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-gray-900">
                {criticalCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {report.insights && report.insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            AI Insights
          </h3>
          <ul className="space-y-2">
            {report.insights.map((insight, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-blue-800">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <HealthDataTable />
    </div>
  );
};

export default Results;
