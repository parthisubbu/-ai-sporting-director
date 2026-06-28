export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-[#0E1325] via-[#1a1f3a] to-[#0E1325] ${className}`}
      style={{ backgroundSize: "200% 100%", animation: "shimmer 2s infinite" }}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-[#0E1325] border border-[rgba(255,255,255,0.055)] rounded-lg space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
