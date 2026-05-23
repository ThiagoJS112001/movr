interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-lg ${className}`}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <Skeleton className="h-8 w-52" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}
