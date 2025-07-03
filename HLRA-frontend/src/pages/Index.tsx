import React from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthData } from "@/contexts/HealthDataContext";

const Index = () => {
  const { user } = useAuth();
  const { reports } = useHealthData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name || "User"}
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and analyze your health lab reports
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Reports Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Upload your first lab report to get started
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Report
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/upload"
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 transition-colors"
          >
            <Upload className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload New Report
            </h3>
            <p className="text-gray-600">Upload and analyze a new lab report</p>
          </Link>

          <Link
            to="/results"
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 transition-colors"
          >
            <FileText className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              View Reports
            </h3>
            <p className="text-gray-600">
              {reports.length} report{reports.length !== 1 ? "s" : ""} available
            </p>
          </Link>

          <Link
            to="/trends"
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Health Trends
            </h3>
            <p className="text-gray-600">
              Track changes in your health parameters
            </p>
          </Link>
        </div>
      )}

      {reports.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-blue-800">
            Regular health check-ups help maintain your well-being. Your last
            report was uploaded on{" "}
            {new Date(
              reports[reports.length - 1].uploadDate
            ).toLocaleDateString()}
            .
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
