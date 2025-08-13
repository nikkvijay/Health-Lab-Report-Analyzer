import React from "react";
import { CheckCircle, AlertTriangle, XCircle, AlertCircle, Activity, TrendingUp, TrendingDown } from "lucide-react";

interface StatusBadgeProps {
  status: "normal" | "high" | "low" | "critical" | "optimal" | "borderline";
  value?: string | number;
  unit?: string;
  referenceRange?: string;
  showTrend?: boolean;
  trend?: "up" | "down" | "stable";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  value, 
  unit, 
  referenceRange, 
  showTrend = false, 
  trend = "stable" 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "optimal":
        return {
          icon: CheckCircle,
          className: "bg-blue-50 text-blue-800 border-2 border-blue-200 shadow-sm",
          label: "Optimal",
          description: "Within ideal range",
          priority: "low",
          pulseColor: "bg-blue-500",
        };
      case "normal":
        return {
          icon: Activity,
          className: "bg-blue-50 text-blue-800 border-2 border-blue-200 shadow-sm",
          label: "Normal",
          description: "Within normal range",
          priority: "low",
          pulseColor: "bg-blue-500",
        };
      case "borderline":
        return {
          icon: AlertTriangle,
          className: "bg-yellow-50 text-yellow-800 border-2 border-yellow-300 shadow-sm",
          label: "Borderline",
          description: "Monitor closely",
          priority: "medium",
          pulseColor: "bg-yellow-500",
        };
      case "high":
        return {
          icon: TrendingUp,
          className: "bg-orange-50 text-orange-800 border-2 border-orange-300 shadow-md",
          label: "High",
          description: "Above normal range",
          priority: "high",
          pulseColor: "bg-orange-500",
        };
      case "low":
        return {
          icon: TrendingDown,
          className: "bg-violet-50 text-violet-800 border-2 border-violet-300 shadow-md",
          label: "Low",
          description: "Below normal range",
          priority: "high",
          pulseColor: "bg-violet-500",
        };
      case "critical":
        return {
          icon: XCircle,
          className: "bg-red-50 text-red-800 border-2 border-red-400 shadow-lg animate-pulse-glow",
          label: "Critical",
          description: "Immediate attention required",
          priority: "critical",
          pulseColor: "bg-red-500",
        };
      default:
        return {
          icon: AlertCircle,
          className: "bg-slate-50 text-slate-800 border-2 border-slate-200 shadow-sm",
          label: "Unknown",
          description: "Status unclear",
          priority: "medium",
          pulseColor: "bg-slate-500",
        };
    }
  };

  const { icon: Icon, className, label, description, priority, pulseColor } = getStatusConfig();

  const getTrendIcon = () => {
    if (!showTrend) return null;
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-slate-600 ml-1" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-slate-600 ml-1" />;
      default:
        return <Activity className="h-3 w-3 text-slate-600 ml-1" />;
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div
        className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md ${className}`}
      >
        <div className="flex items-center gap-2">
          {priority === "critical" && (
            <div className={`w-2 h-2 ${pulseColor} rounded-full animate-pulse`} />
          )}
          <Icon className="h-4 w-4" />
          <span className="font-semibold">{label}</span>
          {value && (
            <span className="text-clinical-value text-sm ml-1">
              {value}
              {unit && <span className="text-xs ml-0.5">{unit}</span>}
            </span>
          )}
          {getTrendIcon()}
        </div>
      </div>
      {(description || referenceRange) && (
        <div className="text-xs text-slate-500 px-1">
          {description && <div>{description}</div>}
          {referenceRange && (
            <div className="font-mono text-xs mt-0.5">
              Range: {referenceRange}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusBadge;

// Medical status utility function for healthcare applications
export const getMedicalStatusFromValue = (
  value: number,
  referenceMin: number,
  referenceMax: number,
  optimalMin?: number,
  optimalMax?: number
): "optimal" | "normal" | "borderline" | "high" | "low" | "critical" => {
  const criticalLowThreshold = referenceMin * 0.7;
  const criticalHighThreshold = referenceMax * 1.5;
  
  if (value <= criticalLowThreshold || value >= criticalHighThreshold) {
    return "critical";
  }
  
  if (value < referenceMin) {
    return value < referenceMin * 0.9 ? "low" : "borderline";
  }
  
  if (value > referenceMax) {
    return value > referenceMax * 1.2 ? "high" : "borderline";
  }
  
  if (optimalMin && optimalMax) {
    if (value >= optimalMin && value <= optimalMax) {
      return "optimal";
    }
  }
  
  return "normal";
};
