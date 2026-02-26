import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import LevelCard from "../components/cgpa/LevelCard";
import Header from "../components/layout/Header";
import AddLevelButton from "../components/cgpa/AddLevelButton";
import LevelsSkeleton from "../components/ui/LevelsSkeleton";

export default function Levels() {
  const navigate = useNavigate();

  const [levels, setLevels] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserId(session.user.id);

        const { data, error } = await supabase
          .from("levels")
          .select(`
            id, 
            level, 
            cgpa,
            semesters (
              id,
              semester,
              gpa,      
              total_units     
            )
          `)
          .eq("user_id", session.user.id)
          .order("level");

        if (error) throw error;

        setLevels(data || []);
      } catch (err) {
        console.error("Failed to fetch levels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [navigate]);

  const calculateTotals = (semesters = []) => {
  return semesters.reduce(
    (acc, sem) => {
      const units = sem.total_units || 0;
      const gpa = sem.gpa || 0;

      acc.units += units;
      acc.points += gpa * units;

      return acc;
    },
    { units: 0, points: 0 }
  );
};

  if (loading) return <LevelsSkeleton />;

  return (
    <div className="min-h-screen p-8 
  bg-gradient-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">
      <Header title="Levels" subtitle="Your academic levels overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-[144px] px-3 h-[calc(100vh-70px)] overflow-y-auto scrollbar-hide">
        {levels.map((lvl) => {
          const { units, points } = calculateTotals(lvl.semesters);
          return (
            <LevelCard
              key={lvl.id}
              level={lvl.level}
              cgpa={lvl.cgpa ?? 0}
              point={points.toFixed(0)}
              unit={units}
              onClick={() =>
                navigate("/semester", { state: { level: lvl.level } })
              }
            />
          )
        })}

        {userId && (
          <AddLevelButton
            userId={userId}
            levels={levels}
            setLevels={setLevels}
          />
        )}
      </div>
    </div>
  );
}