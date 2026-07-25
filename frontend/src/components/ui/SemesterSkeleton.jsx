// components/ui/SemesterSkeleton.jsx
import Skeleton from "./Skeleton";

export default function SemesterSkeleton() {
  return (
    <div className="min-h-screen p-8 
  bg-linear-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">
      {/* Semester cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-32">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-40 rounded-3xl" />
        ))}

        {/* + Add Semester skeleton */}
        <Skeleton className="h-40 rounded-3xl border-2 border-dashed border-white/60" />
      </div>
    </div>
  );
}