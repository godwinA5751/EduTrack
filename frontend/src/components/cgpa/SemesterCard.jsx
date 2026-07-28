
import { FaTrash, FaArrowRight } from "react-icons/fa";

export default function SemesterCard({
  name,
  gpa,
  onClick,
  onDelete,
  className,
  isDeleting,
  canDelete
}) {

  return (
    <div
      className={className}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-white">
          {name}
        </h2>
        {canDelete && (
          <button onClick={onDelete} className={`text-white/50 hover:text-white transition ${isDeleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} disabled={isDeleting}>
            <FaTrash size={20} />
          </button>
        )}
      </div>

      <p className="text-white/80 text-sm mb-4">
        Semester GPA
      </p>

      <div className="flex justify-between items-center">
        <div className="text-3xl font-extrabold text-white">
          {gpa}
        </div>
        <button onClick={onClick} className={`text-white/50 hover:text-white transition ${isDeleting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`} disabled={isDeleting}>
          <FaArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
