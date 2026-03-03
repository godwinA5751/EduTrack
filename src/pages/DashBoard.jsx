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
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const userId = session.user.id;

        const { data, error } = await supabase
          .from("levels")
          .select(`
          id,
          semesters (
            id,
            courses (
              code,
              unit,
              point
            )
          )
        `)
          .eq("user_id", userId);

        if (error) throw error;

        // 🔁 SAME LOGIC AS PROFILE
        const normalize = (code) =>
          code?.toUpperCase().replace(/\s+/g, "") || "";

        const allCourses = [];

        data.forEach((lvl) => {
          lvl.semesters?.forEach((sem) => {
            sem.courses?.forEach((course) => {
              allCourses.push({
                ...course,
                semesterId: sem.id,
              });
            });
          });
        });

        const grouped = {};

        allCourses.forEach((c) => {
          const code = normalize(c.code);
          if (!grouped[code]) grouped[code] = [];
          grouped[code].push(c);
        });

        const resolved = [];

        Object.values(grouped).forEach((attempts) => {
          attempts.sort((a, b) => (b.point || 0) - (a.point || 0));

          const best = attempts[0];

          const original = attempts.reduce((a, b) =>
            a.semesterId < b.semesterId ? a : b
          );

          resolved.push({
            ...original,
            point: best.point || 0,
          });
        });

        let totalUnits = 0;
        let totalPoints = 0;

        resolved.forEach((c) => {
          const unit = c.unit || 0;
          const point = c.point || 0;

          totalUnits += unit;
          totalPoints += unit * point;
        });

        const cgpa = totalUnits ? totalPoints / totalUnits : 0;

        setCumulativeCGPA(Number(cgpa.toFixed(2)));
      } catch (err) {
        console.error(err);
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