import { FaCheckCircle, FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";

export default function ResetSuccessModal({
  open,
  password,
  onClose,
}) {
  if (!open) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);

    toast.success("Temporary password copied!");
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-50">

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-105 p-8">

          <div className="flex flex-col items-center">

            <FaCheckCircle
              className="text-green-500 text-6xl"
            />

            <h2 className="mt-4 text-2xl font-bold text-gray-600 dark:text-gray-300">
              Password Reset
            </h2>

            <p className="mt-2 text-gray-500 dark:text-gray-400 text-center">
              The user's password has been reset successfully.
            </p>

          </div>

          <div className="mt-8">

            <p className="text-sm text-gray-500 dark:text-gray-200 mb-2">
              Temporary Password
            </p>

            <div className="flex items-center justify-between rounded-xl bg-gray-100 dark:bg-gray-700 p-4">

              <span className="font-mono font-bold tracking-wider text-gray-600 dark:text-gray-300">
                {password}
              </span>

              <button
                onClick={handleCopy}
                className="
                  flex
                  items-center
                  gap-2
                  text-[#199FB1]
                  hover:text-[#0D5c75]
                  transition
                  duration-200
                  cursor-pointer
                "
              >
                <FaCopy />

                Copy
              </button>

            </div>

          </div>

          <button
            onClick={onClose}
            className="
              mt-8
              w-full
              rounded-xl
              bg-[#199FB1]
              py-3
              text-white
              hover:bg-[#0D5C75]
              transition
              duration-200
              cursor-pointer
            "
          >
            Close
          </button>

        </div>

      </div>
    </>
  );
}