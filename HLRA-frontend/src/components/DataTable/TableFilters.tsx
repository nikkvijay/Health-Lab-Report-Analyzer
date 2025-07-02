import React from "react";
import { Search, Filter } from "lucide-react";
import { useHealthData } from "../../context/HealthDataContext";

const TableFilters = () => {
  const { state, dispatch } = useHealthData();

  const handleFilterChange = (key: string, value: string) => {
    dispatch({
      type: "SET_FILTERS",
      payload: { [key]: value },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search parameters..."
            value={state.filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <select
            value={state.filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="low">Low</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={state.filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="blood">Blood</option>
            <option value="urine">Urine</option>
            <option value="lipid">Lipid</option>
            <option value="liver">Liver</option>
            <option value="kidney">Kidney</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TableFilters;
