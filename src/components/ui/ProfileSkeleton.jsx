// components/ui/ProfileSkeleton.jsx
import Skeleton from "./Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="
  bg-gradient-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] min-h-screen overflow-hidden px-6 pt-6">
      {/* Header skeleton */}
      <Skeleton className="w-1/4 h-10 mb-6 rounded-3xl" />

      <div className="max-w-3xl mx-auto mt-6 bg-white/20 backdrop-blur-md rounded-3xl p-8 flex flex-col gap-6">
        {/* Avatar skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-48 h-6 rounded-md" />
            <Skeleton className="w-32 h-4 rounded-md" />
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}