export default function StatCard({
  title,
  value,
  icon,
  onClick,
  active = false,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl
        p-6
        shadow-md
        transition-all duration-300
        cursor-pointer
        ${
          active
            ? "bg-[#199FB1] text-white shadow-xl scale-[1.02]"
            : "bg-white dark:bg-gray-800 hover:shadow-lg hover:scale-[1.02]"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm ${
              active
                ? "text-white/80"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {title}
          </p>

          <h2
            className={`text-4xl font-bold mt-2 ${
              active
                ? "text-white"
                : "text-[#199FB1]"
            }`}
          >
            {value}
          </h2>
        </div>

        <div
          className={`text-4xl ${
            active
              ? "text-white"
              : "text-[#199FB1]"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}