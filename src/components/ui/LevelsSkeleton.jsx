// components/ui/LevelsSkeleton.jsx
import Skeleton from "./Skeleton";

export default function LevelsSkeleton() {
  return (
    <div className="min-h-screen p-8 
  bg-gradient-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">
      {/* Header skeleton */}
      <Skeleton className="w-1/3 h-10 mb-6 rounded-3xl" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-[144px] px-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-40 rounded-3xl" />
        ))}

        {/* AddLevelButton skeleton */}
        <Skeleton className="h-40 rounded-3xl border-2 border-dashed border-white/60" />
      </div>
    </div>
  );
}