import { FaKey } from "react-icons/fa";

export default function UserTable({
  users,
  onResetPassword,
  isResetting,
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-md">
      <table className="w-full">
        <thead className="bg-[#199FB1] text-white">
          <tr>
            <th className="px-6 py-4 text-left">Name</th>
            <th className="px-6 py-4 text-left">Matric No.</th>
            <th className="px-6 py-4 text-center">Role</th>
            <th className="px-6 py-4 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {!users || users.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="py-10 text-center text-gray-500"
              >
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              >
                <td className="px-6 py-4">
                  {user.full_name}
                </td>

                <td className="px-6 py-4">
                  {user.matric_no}
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }
                    `}
                  >
                    {user.role}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    disabled={isResetting}
                    onClick={() => onResetPassword(user)}
                    className="
                      px-4 py-2
                      rounded-xl
                      bg-[#199FB1]
                      text-white
                      hover:bg-[#0D5C75]
                      disabled:opacity-50
                      transition
                      cursor-pointer
                      flex
                      items-center
                      justify-center
                      gap-2
                    "
                  >
                    <FaKey />
                    <span>Reset</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
