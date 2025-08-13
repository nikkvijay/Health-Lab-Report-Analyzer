import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHealthData } from "@/contexts/HealthDataContext";
import { healthAPI } from "@/api/index";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";
import {
  Search,
  Grid3X3,
  List,
  FileText,
  Eye,
  Download,
  Trash2,
  MoreHorizontal,
  Calendar,
  SortAsc,
  SortDesc,
  Star,
  Share2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ReportSharing from "@/components/ui/report-sharing";

export default function ReportsPage() {
  const { reports, setReports, setCurrentReport, isLoading, refreshReports } = useHealthData();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(
    new Set()
  );
  const [starredReports, setStarredReports] = useState<Set<string>>(new Set());
  const [sharingReport, setSharingReport] = useState<{id: string, title: string} | null>(null);
  const navigate = useNavigate();

  // Extract starred reports from the context data when reports change
  useEffect(() => {
    const starred = new Set(
      reports
        .filter((report: any) => report.is_starred)
        .map((report: any) => report.id)
    );
    setStarredReports(starred);
  }, [reports]);

  const filteredReports = reports
    .filter((report: any) => {
      const matchesSearch = report.filename
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || report.processing_status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortBy) {
        case "filename":
          comparison = a.filename.localeCompare(b.filename);
          break;
        case "upload_date":
          comparison =
            new Date(a.upload_date).getTime() -
            new Date(b.upload_date).getTime();
          break;
        case "parameters":
          comparison =
            (a.parameters?.length || 0) - (b.parameters?.length || 0);
          break;
        case "starred":
          const aStarred = starredReports.has(a.id) ? 1 : 0;
          const bStarred = starredReports.has(b.id) ? 1 : 0;
          comparison = bStarred - aStarred; // Starred reports first
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await healthAPI.deleteReport(reportId);
      // Refresh reports after deletion using profile-aware context
      await refreshReports();
      // Clear current report if it was deleted
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report. Please try again.");
    }
  };

  const handleViewReport = (report: any) => {
    const transformedReport = {
      id: report.id,
      fileName: report.filename || "Unnamed Report",
      uploadDate: report.upload_date
        ? new Date(report.upload_date)
        : new Date(),
      parameters: report.parameters || [],
      insights: report.insights || [],
      fileUrl: report.file_url,
    };
    setCurrentReport(transformedReport);
    navigate("/results");
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await healthAPI.downloadReport(reportId);
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report. Please try again.");
    }
  };

  // Star functionality with backend persistence
  const toggleStar = async (reportId: string) => {
    try {
      const currentlyStarred = starredReports.has(reportId);
      const newStarredStatus = !currentlyStarred;

      // Update backend first
      await healthAPI.toggleReportStar(reportId, newStarredStatus);

      // Update local state only if backend call succeeds
      setStarredReports((prev) => {
        const newStarred = new Set(prev);
        if (newStarredStatus) {
          newStarred.add(reportId);
        } else {
          newStarred.delete(reportId);
        }
        return newStarred;
      });

      // Update the reports list to reflect the change
      setReports((prevReports: any[]) =>
        prevReports.map((report: any) =>
          report.id === reportId
            ? { ...report, is_starred: newStarredStatus }
            : report
        )
      );
    } catch (error) {
      console.error("Failed to update star status:", error);
      alert("Failed to update star status. Please try again.");
    }
  };

  // Bulk selection functionality
  const toggleSelectReport = (reportId: string) => {
    setSelectedReports((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(reportId)) {
        newSelected.delete(reportId);
      } else {
        newSelected.add(reportId);
      }
      return newSelected;
    });
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(
        new Set(filteredReports.map((report: any) => report.id))
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedReports.size} report${
        selectedReports.size > 1 ? "s" : ""
      }?`
    );

    if (!confirmDelete) return;

    try {
      // Delete all selected reports
      await Promise.all(
        Array.from(selectedReports).map((reportId) =>
          healthAPI.deleteReport(reportId)
        )
      );

      // Refresh reports using profile-aware context
      await refreshReports();
      setSelectedReports(new Set());

      alert(
        `Successfully deleted ${selectedReports.size} report${
          selectedReports.size > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Error bulk deleting reports:", error);
      alert("Failed to delete some reports. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="space-y-6">
              {/* Header Skeleton */}
              <div className="bg-gray-200 h-10 w-1/3 rounded animate-pulse"></div>
              <div className="bg-gray-200 h-4 w-2/3 rounded animate-pulse"></div>
              
              {/* Filters Skeleton */}
              <div className="bg-gray-200 h-20 rounded animate-pulse"></div>
              
              {/* Grid Skeleton */}
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-48 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Medical Reports
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                Manage and analyze your lab reports with AI-powered insights
              </p>
            </div>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate("/upload")}
            >
              <FileText className="mr-2 h-5 w-5" />
              Upload Report
            </Button>
          </div>
        </div>

        {/* Modern Search and Filters */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search reports by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-11 rounded-md border border-gray-300"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44 h-11 rounded-md border border-gray-300">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-sm">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                    <SelectItem value="processing">⏳ Processing</SelectItem>
                    <SelectItem value="failed">❌ Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 h-11 rounded-md border border-gray-300">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-sm">
                    <SelectItem value="upload_date">📅 Date</SelectItem>
                    <SelectItem value="filename">📄 Name</SelectItem>
                    <SelectItem value="parameters">🔬 Parameters</SelectItem>
                    <SelectItem value="starred">⭐ Starred</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 border border-gray-300 rounded-md"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {selectedReports.size > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-red-100 border border-red-200 rounded-md">
                    <span className="text-sm text-red-800 font-semibold">
                      {selectedReports.size} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 rounded-md bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                )}
                <div className="flex rounded-md border border-gray-200 bg-white p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    className={`h-9 rounded-md ${
                      viewMode === "grid"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    className={`h-9 rounded-md ${
                      viewMode === "table"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Display */}
        {filteredReports.length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-600 flex items-center justify-center ">
                <FileText className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {reports.length === 0
                  ? "Welcome to Your Health Dashboard"
                  : "No reports found"}
              </h3>
              <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                {reports.length === 0
                  ? "Start your health journey by uploading your first medical report"
                  : "Try adjusting your search criteria or filters"}
              </p>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate("/upload")}
              >
                <FileText className="mr-2 h-5 w-5" />
                Upload Your First Report
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div>
            {/* Select All Option */}
            {filteredReports.length > 0 && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-md">
                <Checkbox
                  checked={
                    selectedReports.size === filteredReports.length &&
                    filteredReports.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  id="select-all"
                  className="rounded-md"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  Select All Reports ({filteredReports.length})
                </label>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredReports.map((report: any) => (
                <Card
                  key={report.id}
                  className="group bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
                  <CardContent className="relative p-6">
                    <div className="space-y-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedReports.has(report.id)}
                            onCheckedChange={() =>
                              toggleSelectReport(report.id)
                            }
                            className="rounded-md"
                          />
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-600">
                            <FileText className="h-7 w-7 text-white" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleStar(report.id);
                            }}
                            className="p-1 rounded-full hover:bg-yellow-50 transition-colors duration-200"
                          >
                            <Star
                              className={`h-5 w-5 transition-colors duration-200 ${
                                starredReports.has(report.id)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-slate-300 hover:text-yellow-400"
                              }`}
                            />
                          </button>
                          <Badge
                            className={`${report.processing_status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : report.processing_status === 'processing' 
                              ? 'bg-blue-100 text-blue-800' 
                              : report.processing_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-600'} border-0 font-medium`}
                          >
                            {report.processing_status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 text-lg line-clamp-2">
                          {report.original_filename || report.filename}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {formatDate(report.upload_date)}
                          </span>
                          <span className="flex items-center gap-2 text-slate-600">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            {report.parameters?.length || 0} parameters
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border border-gray-200 hover:bg-blue-600 hover:text-white transition-colors duration-200"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-lg">
                            <DialogHeader>
                              <DialogTitle>
                                {selectedReport?.filename}
                              </DialogTitle>
                              <DialogDescription>
                                Date:{" "}
                                {selectedReport &&
                                  formatDate(selectedReport.upload_date)}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <Badge
                                  className={selectedReport ? `${
                                    selectedReport.processing_status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : selectedReport.processing_status === 'processing' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : selectedReport.processing_status === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }` : ""}
                                >
                                  {selectedReport?.processing_status}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() =>
                                      handleDownloadReport(selectedReport.id)
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-lg font-semibold mb-4">
                                  Extracted Parameters
                                </h3>
                                {selectedReport?.parameters?.length ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Parameter</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedReport.parameters.map(
                                        (param: any, index: number) => (
                                          <TableRow key={index}>
                                            <TableCell className="font-medium">
                                              {param.name}
                                            </TableCell>
                                            <TableCell>{param.value}</TableCell>
                                            <TableCell>{param.unit}</TableCell>
                                            <TableCell>
                                              <Badge>{param.status}</Badge>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <p className="text-slate-500">
                                    No parameters extracted yet.
                                  </p>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                            <DropdownMenuItem
                              onClick={() => setSharingReport({id: report.id, title: report.original_filename || report.fileName})}
                              className="cursor-pointer hover:bg-blue-50 hover:text-blue-900"
                            >
                              <Share2 className="mr-2 h-4 w-4 text-blue-600" />
                              Share Report
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownloadReport(report.id)}
                              className="cursor-pointer hover:bg-green-50 hover:text-green-900"
                            >
                              <Download className="mr-2 h-4 w-4 text-blue-600" />
                              Download Report
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-900"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="w-12 font-semibold text-slate-700">
                    <Checkbox
                      checked={
                        selectedReports.size === filteredReports.length &&
                        filteredReports.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                      className="rounded-md"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Report Name
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Upload Date
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Parameters
                  </TableHead>
                  <TableHead className="w-12 font-semibold text-slate-700">
                    ⭐
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReports.has(report.id)}
                        onCheckedChange={() => toggleSelectReport(report.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {report.original_filename || report.filename}
                    </TableCell>
                    <TableCell>{formatDate(report.upload_date)}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${report.processing_status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : report.processing_status === 'processing' 
                          ? 'bg-blue-100 text-blue-800' 
                          : report.processing_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-600'}`}
                      >
                        {report.processing_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.parameters?.length || 0}</TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleStar(report.id);
                        }}
                        className="text-yellow-400 hover:text-yellow-500 transition-colors"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            starredReports.has(report.id)
                              ? "fill-current"
                              : "stroke-current fill-none"
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100"
                          onClick={() => setSharingReport({id: report.id, title: report.original_filename || report.fileName})}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100"
                          onClick={() => handleDownloadReport(report.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Report Sharing Modal */}
      {sharingReport && (
        <ReportSharing
          reportId={sharingReport.id}
          reportTitle={sharingReport.title}
          isOpen={!!sharingReport}
          onClose={() => setSharingReport(null)}
        />
      )}
    </div>
  );
}
