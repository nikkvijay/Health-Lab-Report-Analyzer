import { createContext, useContext, useState, ReactNode } from "react";
import type { LabReport, FileUploadState } from "../types/index";

interface Filters {
  search: string;
  status: string;
  category: string;
}

interface HealthDataContextType {
  reports: LabReport[];
  currentReport: LabReport | null;
  uploadState: FileUploadState;
  filters: Filters;
  setReports: (reports: LabReport[]) => void;
  setCurrentReport: (report: LabReport | null) => void;
  setUploadState: (state: FileUploadState) => void;
  setFilters: (filters: Filters) => void;
}

const initialUploadState: FileUploadState = {
  file: null,
  progress: 0,
  status: "idle",
  error: null,
};

const initialFilters: Filters = {
  search: "",
  status: "",
  category: "",
};

const HealthDataContext = createContext<HealthDataContextType | null>(null);

export const HealthDataProvider = ({ children }: { children: ReactNode }) => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [currentReport, setCurrentReport] = useState<LabReport | null>(null);
  const [uploadState, setUploadState] =
    useState<FileUploadState>(initialUploadState);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const value: HealthDataContextType = {
    reports,
    currentReport,
    uploadState,
    filters,
    setReports,
    setCurrentReport,
    setUploadState,
    setFilters,
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
