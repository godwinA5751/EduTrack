export default function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex items-center justify-between mt-6">

      <button
        onClick={onPrevious}
        disabled={page === 1}
        className="
          px-4 py-2
          rounded-xl
          bg-white dark:bg-gray-400
          shadow
          disabled:opacity-50
          disabled:cursor-not-allowed
          hover:bg-gray-100
          transition
          cursor-pointer
        "
      >
        ← Previous
      </button>

      <span className="font-medium text-white">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="
          px-4 py-2
          rounded-xl
          bg-white dark:bg-gray-400
          shadow
          disabled:opacity-50
          disabled:cursor-not-allowed
          hover:bg-gray-100
          transition
          cursor-pointer
        "
      >
        Next →
      </button>

    </div>
  );
}