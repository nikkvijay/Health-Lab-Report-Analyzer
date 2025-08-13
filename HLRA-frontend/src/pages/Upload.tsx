import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { healthAPI } from "@/api/index";
import { useHealthData } from "@/contexts/HealthDataContext";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";
import { useErrorHandler } from "@/utils/errorHandler";
import {
  Upload,
  FileText,
  ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Pause,
  RotateCcw,
  TestTube,
  Heart,
  Stethoscope,
  Activity,
  Brain,
  Shield,
  Zap,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error" | "paused";
  preview?: string;
  extractedParams?: number;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const { reports, setReports, setCurrentReport, refreshReports } = useHealthData();
  const navigate = useNavigate();
  const { handleApiCall } = useErrorHandler();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "uploading" as const,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Upload files to backend
    for (const uploadFile of newFiles) {
      const result = await handleApiCall(
        () => uploadToBackend(uploadFile),
        `File upload: ${uploadFile.file.name}`,
        { showToast: false } // We'll handle UI updates manually
      );
      
      if (!result) {
        setUploadedFiles((prev) =>
          prev.map((file) =>
            file.id === uploadFile.id ? { ...file, status: "error" } : file
          )
        );
      }
    }
  }, []);

  const uploadToBackend = async (uploadFile: UploadFile) => {
    // Update progress
    const progressInterval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === uploadFile.id && file.progress < 90
            ? { ...file, progress: file.progress + 10 }
            : file
        )
      );
    }, 500);

    try {
      // Upload file
      const response = await healthAPI.uploadFile(uploadFile.file);

      clearInterval(progressInterval);

      // Update to completed
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === uploadFile.id
            ? {
                ...file,
                progress: 100,
                status: "completed",
                extractedParams: response.parameters_count || 0,
              }
            : file
        )
      );

      // Refresh reports list for current profile
      await refreshReports();

      // Transform the response to LabReport format and set as current report
      if (response && reports.length > 0) {
        const latestReport = reports[0]; // Assuming latest report is first
        const transformedReport = {
          id: latestReport.id || Math.random().toString(),
          fileName: latestReport.original_filename || uploadFile.file.name,
          original_filename:
            latestReport.original_filename || uploadFile.file.name,
          uploadDate: latestReport.upload_date
            ? new Date(latestReport.upload_date)
            : new Date(),
          parameters: latestReport.parameters || [],
          insights: latestReport.insights || [],
          fileUrl: latestReport.file_url,
        };
        setCurrentReport(transformedReport);

        // Navigate to reports page to show the results
        setTimeout(() => {
          navigate("/reports");
        }, 1000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      throw error; // Let the higher level error handler deal with this
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const retryFile = async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f
        )
      );
      await uploadToBackend(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "paused":
        return <Pause className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen overflow-y-auto scrollbar-enhanced">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <TestTube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-clinical-title">
              Medical Lab Upload
            </h1>
            <p className="text-medical-note">
              Secure AI-powered analysis and clinical parameter extraction from your lab reports
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Medical Upload Zone */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="card-enhanced border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-medical-heading">Clinical File Upload</CardTitle>
                  <CardDescription className="text-medical-note">
                    Secure upload for lab reports, test results, and medical documents. HIPAA-compliant processing with AI analysis.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 sm:p-12 text-center
  transition-all duration-300 group ${
    isDragActive
      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-emerald-50 shadow-lg"
      : "border-blue-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-emerald-50/50 hover:shadow-md"
  }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-6">
                  <div className="relative">
                    <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <TestTube className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-clinical-title text-xl">
                      {isDragActive
                        ? "Drop your medical files here"
                        : "Upload Lab Reports & Medical Tests"}
                    </h3>
                    <p className="text-medical-note">
                      Secure, encrypted upload with instant AI analysis and clinical parameter extraction
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
                    <div className="flex flex-col items-center gap-2 p-2 sm:p-3 bg-white/60 rounded-lg border border-blue-200">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">PDF Reports</span>
                      <span className="text-xs text-slate-500 hidden sm:block">Lab results, scans</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 sm:p-3 bg-white/60 rounded-lg border border-emerald-200">
                      <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Images</span>
                      <span className="text-xs text-slate-500 hidden sm:block">JPG, PNG scans</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span>AI Powered</span>
                    </div>
                    <span>Max 10MB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Processing Status */}
          {uploadedFiles.length > 0 && (
            <Card className="card-enhanced border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-medical-heading">Clinical Processing Status</CardTitle>
                    <CardDescription className="text-medical-note">
                      Real-time analysis progress with AI-powered parameter extraction
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-lg border border-slate-200 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt="Preview"
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded bg-slate-100 flex-shrink-0">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {file.file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {getStatusIcon(file.status)}
                            <Badge className={getStatusColor(file.status)}>
                              {file.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-2 space-y-2">
                          <Progress value={file.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{file.progress}% complete</span>
                            {file.extractedParams && (
                              <span>
                                {file.extractedParams} parameters found
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          {file.status === "error" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0"
                              onClick={() => retryFile(file.id)}
                            >
                              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Medical Records Sidebar */}
        <Card className="card-enhanced border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50/30 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-medical-heading">Recent Medical Records</CardTitle>
                <CardDescription className="text-medical-note">Your recently analyzed clinical files</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.slice(0, 4).map((report: any) => (
              <div
                key={report.id}
                className="flex items-center gap-3 rounded-xl border-2 border-violet-100 p-4 bg-gradient-to-r from-white to-violet-50/50 hover:from-violet-50 hover:to-violet-100/50 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-parameter-label text-slate-900 truncate">
                    {report.original_filename}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(report.upload_date)}</span>
                    <span>•</span>
                    <TestTube className="h-3 w-3" />
                    <span>{report.parameters?.length || 0} parameters</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-colors px-3 py-1"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
