import { FaEdit } from "react-icons/fa";
import { GRADE_POINTS } from "../../services/academic";

export default function EditCourseModal({
  open,
  form,
  loading,
  onChange,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" />

      <div
        onClick={onCancel}
        className="fixed inset-0 flex items-center justify-center z-50"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-105 p-8"
        >
          <div className="flex flex-col items-center">
            <FaEdit className="text-blue-500 text-5xl" />

            <h2 className="mt-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
              Edit Course
            </h2>

            <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
              Update course details below.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            <input
              name="code"
              value={form.code}
              onChange={onChange}
              placeholder="Course Code"
              className="w-full rounded-xl border p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <input
              type="number"
              name="unit"
              value={form.unit}
              onChange={onChange}
              placeholder="Unit"
              className="w-full rounded-xl border p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <select
              name="grade"
              value={form.grade}
              onChange={onChange}
              className="w-full rounded-xl border p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select Grade</option>

              {Object.keys(GRADE_POINTS).map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border cursor-pointer text-gray-500"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}