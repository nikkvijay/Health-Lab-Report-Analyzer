import React, { useEffect } from "react";
import { CheckCircle, Loader, FileText } from "lucide-react";
import { useHealthData } from "../../context/HealthDataContext";
import { useNavigate } from "react-router-dom";

const UploadProgress = () => {
  const { uploadState, setReports, setCurrentReport } = useHealthData();
  const navigate = useNavigate();

  useEffect(() => {
    if (uploadState.status === "complete") {
      // Simulate creating a lab report with mock data
      const mockReport = {
        id: Date.now().toString(),
        fileName: uploadState.file?.name || "Unknown",
        uploadDate: new Date(),
        parameters: [
          {
            id: "1",
            name: "Glucose",
            value: 95,
            unit: "mg/dL",
            referenceRange: "70-100",
            status: "normal" as const,
            category: "blood" as const,
            date: new Date(),
          },
          {
            id: "2",
            name: "Total Cholesterol",
            value: 220,
            unit: "mg/dL",
            referenceRange: "<200",
            status: "high" as const,
            category: "lipid" as const,
            date: new Date(),
          },
          {
            id: "3",
            name: "HDL Cholesterol",
            value: 45,
            unit: "mg/dL",
            referenceRange: ">40",
            status: "normal" as const,
            category: "lipid" as const,
            date: new Date(),
          },
          {
            id: "4",
            name: "LDL Cholesterol",
            value: 155,
            unit: "mg/dL",
            referenceRange: "<100",
            status: "high" as const,
            category: "lipid" as const,
            date: new Date(),
          },
        ],
        insights: [
          "Your cholesterol levels are elevated. Consider dietary changes.",
          "Glucose levels are within normal range.",
        ],
      };

      setReports((prevReports) => [...prevReports, mockReport]);
      setCurrentReport(mockReport); // Set the current report

      setTimeout(() => {
        navigate("/results");
      }, 1500);
    }
  }, [
    uploadState.status,
    navigate,
    uploadState.file,
    setReports,
    setCurrentReport,
  ]);

  if (uploadState.status === "idle") return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {uploadState.file?.name}
            </p>
            <p className="text-sm text-gray-500">
              {(uploadState.file?.size || 0 / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        {uploadState.status === "uploading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadState.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </div>
        )}

        {uploadState.status === "processing" && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader className="h-5 w-5 animate-spin" />
            <span>Analyzing your report...</span>
          </div>
        )}

        {uploadState.status === "complete" && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Analysis complete! Redirecting to results...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgress;
