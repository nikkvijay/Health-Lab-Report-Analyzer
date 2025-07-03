import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, FileText } from "lucide-react";
import { useHealthData } from "../../contexts/HealthDataContext";
import StatusBadge from "./StatusBadge";
import TableFilters from "./TableFilters";

type SortField = "name" | "value" | "status";
type SortDirection = "asc" | "desc";

const HealthDataTable = () => {
  // ✅ Fixed: Destructure currentReport and filters directly from context
  const { currentReport, filters } = useHealthData();
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredAndSortedData = useMemo(() => {
    if (!currentReport) return [];

    let filtered = currentReport.parameters.filter((param) => {
      const matchesSearch = param.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      const matchesStatus = !filters.status || param.status === filters.status;
      const matchesCategory =
        !filters.category || param.category === filters.category;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "value") {
        aValue = typeof aValue === "number" ? aValue : 0;
        bValue = typeof bValue === "number" ? bValue : 0;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [currentReport, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDirection === "asc" ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )
    ) : (
      <ChevronDown className="h-4 w-4 opacity-30" />
    );

  if (!currentReport) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No lab report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TableFilters />

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Parameter</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Value</span>
                    <SortIcon field="value" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Unit
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Reference Range
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <SortIcon field="status" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedData.map((param) => (
                <tr
                  key={param.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{param.name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {param.category}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {param.value}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{param.unit}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {param.referenceRange}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={param.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedData.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              No parameters match your current filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthDataTable;
