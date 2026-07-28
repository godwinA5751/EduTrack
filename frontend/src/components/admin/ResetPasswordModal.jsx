import { FaTimes } from "react-icons/fa";

export default function ResetPasswordModal({
  open,
  user,
  onCancel,
  onConfirm,
  loading,
}) {
  if (!open || !user) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
      />

      <div 
        onClick={onCancel} className="fixed inset-0 flex items-center justify-center z-50">
        <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-105 p-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Reset Password
            </h2>

            <button onClick={onCancel} className="text-gray-600 dark:text-gray-300 cursor-pointer">
              <FaTimes />
            </button>

          </div>

          <p className="text-gray-600 dark:text-gray-300">

            Are you sure you want to reset the password for

          </p>

          <div className="mt-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-700">

            <p className="font-semibold text-gray-600 dark:text-white/80">
              {user.full_name}
            </p>

            <p className="text-sm text-gray-500 dark:text-white/60">
              {user.matric_no}
            </p>

          </div>

          <div className="flex justify-end gap-3 mt-8">

            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-xl bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              onClick={onConfirm}
              className="px-5 py-2 rounded-xl bg-red-500 text-white cursor-pointer"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

          </div>

        </div>
      </div>
    </>
  );
}