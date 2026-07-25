import Skeleton from "./Skeleton";

export default function HeaderSkeleton() {
  return (
    <div className="bg-white/20 animate-pulse h-24 rounded-3xl fixed top-8 left-6 right-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2 flex-col">
          <Skeleton className="w-25 h-3 rounded-3xl" />
          <Skeleton className="w-45 h-2 rounded-3xl" />
        </div>
        <Skeleton className="ml-12 w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}