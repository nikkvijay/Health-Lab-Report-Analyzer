import React from "react";
import { CheckCircle, AlertTriangle, XCircle, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "normal" | "high" | "low" | "critical";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "normal":
        return {
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200",
          label: "Normal",
        };
      case "high":
        return {
          icon: AlertTriangle,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "High",
        };
      case "low":
        return {
          icon: AlertTriangle,
          className: "bg-orange-100 text-orange-800 border-orange-200",
          label: "Low",
        };
      case "critical":
        return {
          icon: XCircle,
          className: "bg-red-100 text-red-800 border-red-200",
          label: "Critical",
        };
      default:
        return {
          icon: AlertCircle,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          label: "Unknown",
        };
    }
  };

  const { icon: Icon, className, label } = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${className}`}
    >
      <Icon className="h-4 w-4 mr-1" />
      {label}
    </span>
  );
};

export default StatusBadge;
