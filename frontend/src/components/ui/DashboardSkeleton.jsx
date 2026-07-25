// components/ui/DashboardSkeleton.jsx
import Skeleton from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="p-8 bg-linear-to-br from-[#A5D1E1] via-[#199FB1] to-[#0D5C75] dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">
      <div className="flex items-center justify-center gap-15 flex-col lg:flex-row absolute top-[50%] translate-x-[-50%] translate-y-[-50%] left-[50%]">
        {/* CGPAProgress skeleton */}
        <Skeleton className="w-60 h-60 rounded-full mt-20 -mb-10 lg:my-0" />

        {/* Message skeleton */}
        <Skeleton className="w-80 h-40 rounded-3xl" />
      </div>
    </div>
  );
}