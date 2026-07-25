import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Header from "../components/layout/Header";
import adminApi from "../services/admin";
import {
  FaUsers,
  FaUserGraduate,
  FaUserShield,
  FaSearch 
} from "react-icons/fa";

import StatCard from "../components/admin/StatCard";
import UserTable from "../components/admin/UserTable";
import ResetPasswordModal from "../components/admin/ResetPasswordModal";
import AdminSkeleton from "../components/ui/AdminSkeleton";
import Pagination from "../components/admin/Pagination";
import ResetSuccessModal from "../components/admin/ResetSuccessModal";

export default function Admin() {
  const [stats, setStats] = useState({
      totalUsers: 0,
      students: 0,
      admins: 0,
    });
  
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false); 
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(search);
      }, 500);
  
      return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
      fetchUsers(currentPage, debouncedSearch, roleFilter);
  }, [roleFilter, debouncedSearch, currentPage]);

  useEffect(() => {
      setCurrentPage(1);
  }, [debouncedSearch, roleFilter]);
  
  const fetchUsers = async (
        page = 1,
        search = "",
        role = "all"
    ) => {
      try {
        if (loading) {
          setLoading(true);
        } else {
          setFetching(true);
        }
  
        const { data } = await adminApi.get("/users", {
          params: {
            page,
            limit: 10,
            search,
            role
          },
        });
  
        setStats(data.stats ?? { totalUsers: 0, students: 0, admins: 0 });
        setUsers(data.users ?? []);
        setPagination(data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 });

      } catch (err) {
  console.error(err);

  toast.error(
    err.response?.data?.message ||
    err.message ||
    "Failed to load users."
  );
} finally {
        setLoading(false);
        setFetching(false);
      }
    };

  const handleResetPassword = async () => {
    try {
      setIsResetting(true);
  
      const { data } = await adminApi.post("/reset-password", {
        profileId: selectedUser.id,
      });
  
      setTemporaryPassword(data.temporaryPassword);
      
      setShowModal(false);
      
      setShowSuccessModal(true);
  
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to reset password.";
      toast.error(message);
    } finally {
      setIsResetting(false);
    }
  };
  
  if (loading) return <AdminSkeleton />;
  
  return (
  <div className="min-h-screen p-8 
    bg-linear-to-br 
    from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
    dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">

    <Header title="Admin" subtitle="Manage EduTrack users" />

    <div className="pt-36 px-3 h-[calc(100vh-70px)] overflow-y-auto scrollbar-hide">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<FaUsers />}
          active={roleFilter === "all"}
          onClick={() => setRoleFilter("all")}
        />
      
        <StatCard
          title="Students"
          value={stats.students}
          icon={<FaUserGraduate />}
          active={roleFilter === "student"}
          onClick={() => setRoleFilter("student")}
        />
      
        <StatCard
          title="Admins"
          value={stats.admins}
          icon={<FaUserShield />}
          active={roleFilter === "admin"}
          onClick={() => setRoleFilter("admin")}
        />

      </div>

      <div className="mt-8 relative">
      
          <FaSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
      
          <input
            type="text"
            placeholder="Search by name or matric number..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="
              w-full
              bg-white
              dark:bg-gray-800
              rounded-xl
              py-3
              pl-12
              pr-4
              shadow-md
              outline-none
              focus:ring-2
              focus:ring-[#199FB1]
              text-gray-600 dark:text-gray-300
            "
          />
      
      </div>

      <UserTable
        users={users}
        fetching={fetching}
        isResetting={isResetting}
        onResetPassword={(user) => {
          setSelectedUser(user);
          setShowModal(true);
        }}
      />

      <ResetPasswordModal
          open={showModal}
          user={selectedUser}
          loading={isResetting}
          onCancel={() => {
              setShowModal(false);
              setSelectedUser(null);
          }}
          onConfirm={handleResetPassword}
        />
        
      <ResetSuccessModal
        open={showSuccessModal}
        password={temporaryPassword}
        onClose={() => {
          setShowSuccessModal(false);
          setTemporaryPassword("");
          setSelectedUser(null);
        }}
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPrevious={() => setCurrentPage((p) => p - 1)}
        onNext={() => setCurrentPage((p) => p + 1)}
      />
    </div>
  </div>
  );
}
