import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import CGPAProgress from "../components/cgpa/CGPAProgress";
import Header from "../components/layout/Header";
import Message from "../components/layout/Message";
import DashboardSkeleton from "../components/ui/DashboardSkeleton";

export default function DashBoard() {
  const navigate = useNavigate();
  const [cumulativeCGPA, setCumulativeCGPA] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCGPA = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const { data: semesters, error } = await supabase
          .from("semesters")
          .select("gpa, total_units, level:levels!inner(user_id)")
          .eq("level.user_id", session.user.id);

        if (error) throw error;

        let totalPoints = 0;
        let totalUnits = 0;

        semesters.forEach((sem) => {
          if (sem.gpa && sem.total_units) {
            totalPoints += sem.gpa * sem.total_units;
            totalUnits += sem.total_units;
          }
        });

        const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
        setCumulativeCGPA(Number(cgpa.toFixed(2)));
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchCGPA();
  }, [navigate]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="overflow-hidden min-h-screen p-8 bg-gradient-to-br from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]">
      <Header title="Dashboard" subtitle="Track your academic progress" />

      <div className="flex items-center justify-center gap-15 flex-col lg:flex-row h-screen overflow-y-auto scrollbar-hide scroll-smooth">
        <CGPAProgress cgpa={cumulativeCGPA} />
        <Message />
      </div>
    </div>
  );
}