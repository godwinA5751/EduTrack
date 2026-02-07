// components/ui/DashboardSkeleton.jsx
import Skeleton from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="overflow-hidden min-h-screen p-8 bg-gradient-to-br from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]">
      {/* Header skeleton */}
      <Skeleton className="w-1/3 h-10 mb-6 rounded-3xl" />

      <div className="flex items-center justify-center gap-15 flex-col lg:flex-row h-screen overflow-y-auto scrollbar-hide scroll-smooth">
        {/* CGPAProgress skeleton */}
        <Skeleton className="w-60 h-60 rounded-full mb-6 lg:mb-0" />

        {/* Message skeleton */}
        <Skeleton className="w-80 h-40 rounded-3xl" />
      </div>
    </div>
  );
}