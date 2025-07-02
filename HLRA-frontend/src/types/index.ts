export type FileStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

export interface FileUploadState {
  file: File | null;
  progress: number;
  status: FileStatus;
  error: string | null;
}

export interface HealthParameter {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: "normal" | "high" | "low" | "critical";
  category: "blood" | "urine" | "lipid" | "liver" | "kidney";
  date: Date;
}

export interface LabReport {
  id: string;
  fileName: string;
  uploadDate: Date;
  parameters: HealthParameter[];
  insights?: string[];
  fileUrl?: string;
}

export interface TrendData {
  date: string;
  glucose: number;
  cholesterol: number;
  bloodPressure: number;
}
