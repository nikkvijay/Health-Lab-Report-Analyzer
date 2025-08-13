import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import { useHealthData } from "../../contexts/HealthDataContext";
import { notificationService } from "../../services/notificationService";
import { healthAPI } from "../../api";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

const DropZone = () => {
  const { setUploadState } = useHealthData();
  const [localState, setLocalState] = useState({
    file: null as File | null,
    progress: 0,
    status: "idle" as
      | "idle"
      | "uploading"
      | "processing"
      | "complete"
      | "error",
    error: null as string | null,
  });

  // Sync local state with global state
  useEffect(() => {
    setUploadState(localState);
  }, [localState, setUploadState]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setLocalState({
        file: null,
        progress: 0,
        status: "error",
        error: "Invalid file type. Please upload PDF or image files only.",
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      setLocalState({
        file,
        status: "idle",
        progress: 0,
        error: null,
      });

      // Start upload process
      uploadFile(file);
    }
  }, []);

  const uploadFile = async (file: File) => {
    const reportId = Date.now().toString();

    try {
      setLocalState((prev) => ({
        ...prev,
        status: "uploading",
        progress: 0,
        error: null,
      }));

      // Notify upload started
      notificationService.reportUploadStarted(file.name, reportId);

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random progress between 5-20%
        if (progress > 95) progress = 95; // Don't complete until API call finishes

        setLocalState((prev) => ({
          ...prev,
          progress,
        }));
      }, 300);

      // Call actual API
      const response = await healthAPI.uploadFile(file);

      // Clear progress interval and complete upload
      clearInterval(progressInterval);
      setLocalState((prev) => ({
        ...prev,
        progress: 100,
        status: "processing",
      }));

      toast.success("File uploaded successfully!");

      // Start checking processing status - use id instead of file_id
      checkProcessingStatus(response.id || response.file_id, file.name);
    } catch (error: any) {
      console.error("Upload error:", error); // Debug log
      clearInterval(progressInterval); // Make sure to clear interval

      setLocalState((prev) => ({
        ...prev,
        status: "error",
        error:
          error.response?.data?.detail ||
          error.message ||
          "Upload failed. Please try again.",
        progress: 0,
      }));

      toast.error(
        `Upload failed: ${
          error.response?.data?.detail || error.message || "Unknown error"
        }`
      );
      notificationService.reportProcessingFailed(
        file.name,
        reportId,
        error.response?.data?.detail || error.message || "Upload failed"
      );
    }
  };

  const checkProcessingStatus = async (fileId: string, filename: string) => {
    // Poll for processing completion
    const pollInterval = setInterval(async () => {
      try {
        const report = await healthAPI.getReport(fileId);

        if (report.processing_status === "completed") {
          clearInterval(pollInterval);
          setLocalState((prev) => ({
            ...prev,
            status: "complete",
          }));

          const parametersFound = report.parameters?.length || 0;
          notificationService.reportProcessingComplete(
            filename,
            fileId,
            parametersFound
          );
          toast.success(
            `Processing complete! Found ${parametersFound} parameters.`
          );

          // Refresh the reports list to show the new file
          window.dispatchEvent(new CustomEvent("refreshReports"));
        } else if (report.processing_status === "failed") {
          clearInterval(pollInterval);
          setLocalState((prev) => ({
            ...prev,
            status: "error",
            error: report.error_message || "Processing failed",
          }));

          notificationService.reportProcessingFailed(
            filename,
            fileId,
            report.error_message || "Processing failed"
          );
          toast.error("Processing failed");
        }
        // Continue polling if status is 'processing' or 'uploading'
      } catch (error: any) {
        console.error("Error checking processing status:", error); // Debug log
        clearInterval(pollInterval);
        setLocalState((prev) => ({
          ...prev,
          status: "error",
          error: `Failed to check processing status: ${
            error.message || "Unknown error"
          }`,
        }));
        toast.error("Failed to check processing status");
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (localState.status === "processing") {
        setLocalState((prev) => ({
          ...prev,
          status: "error",
          error: "Processing timeout - this may take longer than expected",
        }));
      }
    }, 5 * 60 * 1000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : localState.status === "error"
            ? "border-red-300 bg-red-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          {/* Status Icon */}
          {localState.status === "error" ? (
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          ) : localState.status === "complete" ? (
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          ) : localState.status === "uploading" ||
            localState.status === "processing" ? (
            <div className="relative">
              <Clock className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
            </div>
          ) : (
            <div className={`${isDragActive ? "animate-bounce" : ""}`}>
              <Upload className="h-12 w-12 text-blue-500 mx-auto" />
            </div>
          )}

          {/* Status Text */}
          <div>
            {localState.status === "error" ? (
              <>
                <p className="text-red-600 font-medium mb-2">Upload Failed</p>
                <p className="text-red-500 text-sm">{localState.error}</p>
              </>
            ) : localState.status === "complete" ? (
              <>
                <p className="text-green-600 font-medium mb-2">
                  Processing Complete!
                </p>
                <p className="text-green-600 text-sm">
                  {localState.file?.name} has been processed successfully.
                </p>
              </>
            ) : localState.status === "uploading" ? (
              <>
                <p className="text-blue-600 font-medium mb-2">Uploading...</p>
                <p className="text-blue-600 text-sm">
                  Uploading {localState.file?.name}
                </p>
              </>
            ) : localState.status === "processing" ? (
              <>
                <p className="text-blue-600 font-medium mb-2">Processing...</p>
                <p className="text-blue-600 text-sm">
                  Extracting health parameters from {localState.file?.name}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragActive ? "Drop your file here" : "Upload Lab Report"}
                </p>
                <p className="text-gray-600">
                  Drag and drop your PDF or image file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: PDF, JPG, PNG (max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {(localState.status === "uploading" ||
            localState.status === "processing") && (
            <div className="w-full max-w-md mx-auto space-y-2">
              <Progress value={localState.progress} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {localState.status === "uploading"
                    ? "Uploading"
                    : "Processing"}
                </span>
                <span>{Math.round(localState.progress)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-center space-x-3">
        {localState.status === "error" && (
          <>
            <Button
              onClick={() =>
                setLocalState({
                  file: null,
                  progress: 0,
                  status: "idle",
                  error: null,
                })
              }
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={() => {
                if (localState.file) {
                  uploadFile(localState.file);
                }
              }}
              disabled={!localState.file}
            >
              <Upload className="w-4 h-4 mr-2" />
              Retry Upload
            </Button>
          </>
        )}

        {localState.status === "complete" && (
          <Button
            onClick={() =>
              setLocalState({
                file: null,
                progress: 0,
                status: "idle",
                error: null,
              })
            }
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Another File
          </Button>
        )}

        {(localState.status === "uploading" ||
          localState.status === "processing") && (
          <Button
            onClick={() => {
              setLocalState({
                file: null,
                progress: 0,
                status: "idle",
                error: null,
              });
            }}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default DropZone;
