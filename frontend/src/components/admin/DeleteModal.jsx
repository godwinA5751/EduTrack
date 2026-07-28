import { FaTrash } from "react-icons/fa";

export default function DeleteModal({
  open,
  loading,
  title = "Delete",
  description = "Are you sure you want to delete",
  warning,
  itemName,
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
            <FaTrash className="text-red-500 text-5xl" />

            <h2 className="mt-4 text-2xl font-bold text-gray-700 dark:text-gray-200">
              {title}
            </h2>

            <p className="mt-3 text-center text-gray-500 dark:text-gray-400">
              {description}
            </p>

            {itemName && (
              <p className="font-bold mt-1 text-gray-700 dark:text-gray-200">
                {itemName}
              </p>
            )}

            <p className="mt-4 text-sm text-red-500 text-center">
              {warning ?? "This action cannot be undone."}
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border text-gray-500 cursor-pointer"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}