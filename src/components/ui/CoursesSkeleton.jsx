// components/ui/CoursesSkeleton.jsx
import Skeleton from "./Skeleton";

export default function CoursesSkeleton() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]">
      {/* Header skeleton */}
      <Skeleton className="w-1/3 h-10 mb-6 rounded-3xl" />

      {/* Form + Courses skeleton */}
      <div className="grid lg:grid-cols-2 gap-6 mt-24">
        <Skeleton className="h-24 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}