import React from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  FileText,
  TrendingUp,
  Activity,
  Users,
  Calendar,
} from "lucide-react";
import { useHealthData } from "../context/HealthDataContext";

const Index = () => {
  const { reports } = useHealthData(); // Make sure this hook is used within HealthDataProvider

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Health Lab Report Dashboard</h1>

      {/* Add null check for reports */}
      {reports && reports.length > 0 ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Health Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back! Here's an overview of your health data and recent
              activity.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/upload"
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Upload className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Upload New Report</h3>
                  <p className="text-blue-100">
                    Add a new lab report for analysis
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/results"
              className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">View Results</h3>
                  <p className="text-green-100">
                    Analyze your latest lab results
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/trends"
              className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Health Trends</h3>
                  <p className="text-purple-100">Track changes over time</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Reports
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Parameters Tracked
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports[0]?.parameters.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Normal Values
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports[0]?.parameters.filter((p) => p.status === "normal")
                      .length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Needs Attention
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports[0]?.parameters.filter((p) => p.status !== "normal")
                      .length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports
                  .slice(-3)
                  .reverse()
                  .map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {report.fileName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {report.uploadDate.toLocaleDateString()} •{" "}
                            {report.parameters.length} parameters
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/results"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Results
                      </Link>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No lab reports uploaded yet
                </p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Report
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>No reports available. Please upload a lab report to get started.</p>
      )}
    </div>
  );
};

export default Index;
