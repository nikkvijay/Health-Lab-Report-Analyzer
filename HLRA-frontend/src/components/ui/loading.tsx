import React from "react";
import { cn } from "@/lib/utils";
import { HealthLineSkeleton, Skeleton } from "./skeleton";
import { Activity, Heart, Zap } from "lucide-react";

interface LoadingProps {
  className?: string;
  message?: string;
  showHealthLine?: boolean;
  variant?: "default" | "health" | "pulse";
}

const Loading: React.FC<LoadingProps> = ({
  className,
  message = "Loading...",
  showHealthLine = true,
  variant = "default",
}) => {
  const renderLoadingContent = () => {
    switch (variant) {
      case "health":
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Heart className="h-8 w-8 text-red-500 animate-pulse" />
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">
                Analyzing health data...
              </p>
            </div>
            {showHealthLine && (
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Health Status</span>
                  <span>Processing...</span>
                </div>
                <HealthLineSkeleton />
              </div>
            )}
          </div>
        );

      case "pulse":
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Zap className="h-8 w-8 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">
                Processing data...
              </p>
            </div>
            {showHealthLine && (
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>Loading...</span>
                </div>
                <HealthLineSkeleton />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Activity className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">Please wait...</p>
            </div>
            {showHealthLine && (
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Status</span>
                  <span>Loading...</span>
                </div>
                <HealthLineSkeleton />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center p-8 rounded-lg border bg-card/50 backdrop-blur-sm",
        className
      )}
    >
      {renderLoadingContent()}
    </div>
  );
};

// Full Page Loading
const FullPageLoading: React.FC<{ message?: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <Loading message={message} variant="health" />
  </div>
);

// Inline Loading
const InlineLoading: React.FC<{
  message?: string;
  size?: "sm" | "md" | "lg";
}> = ({ message, size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center space-x-2">
      <Activity
        className={cn("text-primary animate-spin", sizeClasses[size])}
      />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
};

// Health Status Loading
const HealthStatusLoading: React.FC<{ status?: string }> = ({
  status = "Analyzing",
}) => (
  <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
    <div className="relative">
      <Heart className="h-5 w-5 text-red-500 animate-pulse" />
      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
    </div>
    <div className="flex-1 space-y-1">
      <p className="text-sm font-medium">Health Analysis</p>
      <p className="text-xs text-muted-foreground">{status}...</p>
    </div>
    <HealthLineSkeleton className="w-20" />
  </div>
);

export { Loading, FullPageLoading, InlineLoading, HealthStatusLoading };
