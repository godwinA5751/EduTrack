import Sidebar from "./SideBar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderSkeleton from "../ui/HeaderSkeleton";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../queries/userQueries";

export default function Header({ title, subtitle }) {
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (error) {
      navigate("/login");
    }
  }, [error, navigate]);

  if (isLoading) return <HeaderSkeleton />;
  if (!user) return null;

  const initial = user.full_name?.charAt(0) || "?";

  return (
    <header className="fixed top-8 left-6 right-6 z-50 rounded-3xl 
  bg-linear-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] p-6 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div>
          <h1 className="text-white text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
        </div>

        {/* Right */}
        <div className="text-right">
          <Sidebar icon={initial} name={user.full_name} role={user.role} />
        </div>
      </div>
    </header>
  );
}
