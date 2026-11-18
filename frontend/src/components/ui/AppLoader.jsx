
export default function AppLoader({
  message = "Loading EduTrack...",
}) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4
      bg-linear-to-br
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]"
    >
      <div className="flex flex-col items-center gap-5">
        {/* Loading spinner */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-white/25" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" />
        </div>

        <p className="text-white font-semibold tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
