
export default function Button({ children, className, onClick, loading }) {
  return (
    <button className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
