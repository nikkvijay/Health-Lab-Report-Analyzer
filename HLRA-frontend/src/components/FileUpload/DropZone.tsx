import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle } from "lucide-react";
import { useHealthData } from "../../contexts/HealthDataContext";

const DropZone = () => {
  const { uploadState, setUploadState } = useHealthData();

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        setUploadState({
          ...uploadState,
          status: "error",
          error: "Invalid file type. Please upload PDF or image files only.",
        });
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadState({
          file,
          status: "uploading",
          progress: 0,
          error: null,
        });

        // Simulate upload progress
        simulateUpload();
      }
    },
    [uploadState, setUploadState]
  );

  const simulateUpload = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadState((prevState: typeof uploadState) => ({
        ...prevState,
        progress,
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setUploadState((prevState: typeof uploadState) => ({
          ...prevState,
          status: "processing",
        }));

        // Simulate processing
        setTimeout(() => {
          setUploadState((prevState: typeof uploadState) => ({
            ...prevState,
            status: "complete",
          }));
        }, 2000);
      }
    }, 200);
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
            : uploadState.status === "error"
            ? "border-red-300 bg-red-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          {uploadState.status === "error" ? (
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          ) : (
            <div className={`${isDragActive ? "animate-bounce" : ""}`}>
              <Upload className="h-12 w-12 text-blue-500 mx-auto" />
            </div>
          )}

          <div>
            {uploadState.status === "error" ? (
              <p className="text-red-600 font-medium">{uploadState.error}</p>
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
        </div>
      </div>

      {uploadState.status === "error" && (
        <button
          onClick={() =>
            setUploadState({
              file: null,
              progress: 0,
              status: "idle",
              error: null,
            })
          }
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto block"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default DropZone;
