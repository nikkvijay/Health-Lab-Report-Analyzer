import React from "react";
import DropZone from "../components/FileUpload/DropZone";
import UploadProgress from "../components/FileUpload/UploadProgress";
import { useHealthData } from "../context/HealthDataContext";
import { type FileUploadState } from "../types/health.types";

const Upload = () => {
  const { uploadState } = useHealthData();

  if (!uploadState) {
    return null; // or loading state
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Lab Report
        </h1>
        <p className="text-gray-600">
          Upload your lab report and get instant AI-powered analysis of your
          health parameters
        </p>
      </div>

      <DropZone />
      <UploadProgress />

      {uploadState.status === "idle" && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-lg">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload Report</h3>
            <p className="text-gray-600 text-sm">
              Drag and drop your PDF or image file to get started
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-lg">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
            <p className="text-gray-600 text-sm">
              Our AI extracts and analyzes your health parameters
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-lg">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">View Results</h3>
            <p className="text-gray-600 text-sm">
              Get detailed insights and track your health trends
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
