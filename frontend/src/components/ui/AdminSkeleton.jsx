export default function AdminSkeleton() {
  return (
    <div className="">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map((i) => (
          <div
            key={i}
            className="h-36 rounded-3xl bg-white/30 animate-pulse"
          />
        ))}
      </div>

      {/* Search */}
      <div className="mt-8 h-12 rounded-xl bg-white/30 animate-pulse" />

      {/* Table */}
      <div className="mt-6 rounded-3xl bg-white/30 p-6">

        {[1,2,3,4,5].map((i)=>(
          <div
            key={i}
            className="h-10 mb-4 rounded bg-white/40 animate-pulse"
          />
        ))}

      </div>
    </div>
  );
}