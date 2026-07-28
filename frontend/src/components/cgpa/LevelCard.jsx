import { FaTrash } from "react-icons/fa";

export default function LevelCard({ level, gpa, onClick, onDelete, isDeleting, canDelete }) {

  return (
    <div className="rounded-3xl bg-white dark:bg-gray-800 shadow-md p-6 hover:shadow-lg transition h-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0D5C75] dark:text-white">
          {`${level} lvl`}
        </h2>

        <span className="text-sm text-gray-400">
          GPA
        </span>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-[#199FB1]">
          {gpa > 0 ? gpa.toFixed(2): '--'}
        </span>
        <span className="text-sm text-gray-400">
          / 5.00
        </span>
      </div>
      <div className="flex justify-end gap-12 mt-7">
        {canDelete && (
          <button onClick={onDelete} className={`text-[#199FB1] hover:text-[#199FB1]/80 transition ${isDeleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} disabled={isDeleting}>
            <FaTrash size={20} />
          </button>
        )}
        <button
          onClick={onClick}
          className={`${canDelete ? "w-90" : "w-full"}
            py-2 rounded-xl bg-[#A7EBF2]/40 text-[#0D5C75]
            dark:bg-[#0F3A47]/40 dark:text-[#7FD6E3] font-medium hover:bg-[#A7EBF2]/60 dark:hover:bg-[#0F3A47]/60 transition delay-200 cursor-pointer`}
        >
          {gpa === 0.0 ? "Get Started →" : "View Semesters →"}
        </button>
      </div>
    </div>
  );
}
