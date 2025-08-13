import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { LabReport, FileUploadState, FamilyProfile } from "../types/index";
import { healthAPI } from "../api/index";

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
  isLoading: boolean;
  setReports: (reports: LabReport[]) => void;
  setCurrentReport: (report: LabReport | null) => void;
  setUploadState: (state: FileUploadState) => void;
  setFilters: (filters: Filters) => void;
  refreshReports: () => Promise<void>;
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
  const [uploadState, setUploadState] = useState<FileUploadState>(initialUploadState);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Function to fetch reports for the active profile
  const refreshReports = async () => {
    setIsLoading(true);
    try {
      // Try to fetch reports with profile ID first, then fall back to all reports
      let profileReports;
      if (activeProfileId) {
        profileReports = await healthAPI.getReports(activeProfileId);
      } else {
        profileReports = await healthAPI.getReports();
      }
      
      
      
      // Ensure we have an array
      const reportsArray = Array.isArray(profileReports) ? profileReports : [];
      setReports(reportsArray);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for active profile changes from family profile context
  useEffect(() => {
    const handleProfileChange = (event: CustomEvent<{ activeProfileId: string | null }>) => {
      setActiveProfileId(event.detail.activeProfileId);
    };

    const handleReportsRefresh = () => {
      refreshReports();
    };

    // Listen for custom events from FamilyProfileContext and upload completion
    window.addEventListener('activeProfileChanged', handleProfileChange as EventListener);
    window.addEventListener('refreshReports', handleReportsRefresh);

    return () => {
      window.removeEventListener('activeProfileChanged', handleProfileChange as EventListener);
      window.removeEventListener('refreshReports', handleReportsRefresh);
    };
  }, [activeProfileId]); // Add activeProfileId as dependency to avoid stale closure

  // Refresh reports when active profile changes or on mount
  useEffect(() => {
    refreshReports();
  }, [activeProfileId]);

  // Initial load of reports
  useEffect(() => {
    refreshReports();
  }, []); // Run once on mount

  const value: HealthDataContextType = {
    reports,
    currentReport,
    uploadState,
    filters,
    isLoading,
    setReports,
    setCurrentReport,
    setUploadState,
    setFilters,
    refreshReports,
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
