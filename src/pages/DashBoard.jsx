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

        // Fetch all semesters for this user with stored GPA and units
        const { data: semesters, error } = await supabase
          .from("semesters")
          .select(`
            gpa,
            total_units,
            level:levels!inner(user_id)
          `)
          .eq("level.user_id", session.user.id);

        if (error) throw error;

        // Calculate cumulative CGPA from stored semester GPAs
        let totalPoints = 0;
        let totalUnits = 0;

        semesters.forEach((sem) => {
          const gpa = sem.gpa || 0;
          const units = sem.total_units || 0;
          totalPoints += gpa * units;
          totalUnits += units;
        });

        const cgpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
        setCumulativeCGPA(Number(cgpa.toFixed(2)));

      } catch (err) {
        console.error("Failed to fetch CGPA:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchCGPA();
  }, [navigate]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="overflow-hidden min-h-screen p-8 
      bg-gradient-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">
      
      <Header title="Dashboard" subtitle="Track your academic progress" />

      <div className="flex items-center justify-center gap-15 flex-col lg:flex-row h-screen overflow-y-auto scrollbar-hide scroll-smooth">
        <CGPAProgress cgpa={cumulativeCGPA} />
        <Message />
      </div>
    </div>
  );
}