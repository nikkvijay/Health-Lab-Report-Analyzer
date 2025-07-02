import { createContext, useContext, useState } from "react";
import type { LabReport, FileUploadState } from "../types/health.types";

interface HealthDataContextType {
  reports: LabReport[];
  currentReport: LabReport | null;
  uploadState: FileUploadState;
  setReports: (reports: LabReport[]) => void;
  setCurrentReport: (report: LabReport | null) => void;
  setUploadState: (state: FileUploadState) => void;
}

const initialUploadState: FileUploadState = {
  file: null,
  progress: 0,
  status: "idle",
  error: null,
};

const HealthDataContext = createContext<HealthDataContextType>({
  reports: [],
  currentReport: null,
  uploadState: initialUploadState,
  setReports: () => {},
  setCurrentReport: () => {},
  setUploadState: () => {},
});

export const HealthDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [currentReport, setCurrentReport] = useState<LabReport | null>(null);
  const [uploadState, setUploadState] =
    useState<FileUploadState>(initialUploadState);

  const value = {
    reports,
    currentReport,
    uploadState,
    setReports,
    setCurrentReport,
    setUploadState,
  };

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
};

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error("useHealthData must be used within a HealthDataProvider");
  }
  return context;
};
