import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CGPAProgress from "../components/cgpa/CGPAProgress";
import CGPATrend from "../components/cgpa/CGPATrend";
import Header from "../components/layout/Header";
import Message from "../components/layout/Message";
import DashboardSkeleton from "../components/ui/DashboardSkeleton";
import { useQuery } from "@tanstack/react-query";
import { getDashboardCGPA } from "../queries/dashboardQueries";

export default function DashBoard() {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-cgpa"],
    queryFn: getDashboardCGPA,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (error?.message === "Not authenticated") {
      navigate("/login", { replace: true });
    }
  }, [error, navigate]);

  return (
    <div className="overflow-hidden min-h-screen p-8 
      bg-linear-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">

      <Header title="Dashboard" subtitle="Track your academic progress" />

      {isLoading ? <DashboardSkeleton /> : (
        <div className="flex items-center justify-center gap-5 md:gap-15 lg:gap-25 flex-col lg:flex-row absolute top-[50%] translate-x-[-50%] translate-y-[-50%] left-[50%] mt-10 lg:mt-0">
          <CGPAProgress cgpa={data?.cgpa ?? 0} />
          {data?.cgpa > 0 && <CGPATrend data={data?.trend ?? []} />}
          {data?.cgpa === 0 && <Message />}
        </div>
      )}
    </div>
  );
}