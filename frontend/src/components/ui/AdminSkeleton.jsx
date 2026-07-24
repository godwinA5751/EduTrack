export default function AdminSkeleton() {
  return (
    <div className="min-h-screen p-8
      bg-linear-to-br
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">

      <div className="pt-36">

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
    </div>
  );
}