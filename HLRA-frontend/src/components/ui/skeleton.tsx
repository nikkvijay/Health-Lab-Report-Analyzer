import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Health Line Skeleton - shows a pulsing health line
function HealthLineSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-muted/50 h-2",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 h-full w-1/3 animate-pulse rounded-full shadow-lg" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent h-full w-full animate-pulse" />
    </div>
  );
}

// Card Skeleton with health line
function CardSkeleton({
  className,
  showHealthLine = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showHealthLine?: boolean }) {
  return (
    <div
      className={cn("rounded-lg border bg-card p-4 space-y-3", className)}
      {...props}
    >
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {showHealthLine && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Health Status</span>
            <span>Loading...</span>
          </div>
          <HealthLineSkeleton />
        </div>
      )}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
}

// Table Row Skeleton
function TableRowSkeleton({
  className,
  columns = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div
      className={cn("flex items-center space-x-4 py-3", className)}
      {...props}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

// Dashboard Stats Skeleton
function StatsSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
      {...props}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16" />
          <HealthLineSkeleton />
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  HealthLineSkeleton,
  CardSkeleton,
  TableRowSkeleton,
  StatsSkeleton,
};
