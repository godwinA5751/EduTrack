import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import LevelCard from "../components/cgpa/LevelCard";
import Header from "../components/layout/Header";
import AddLevelButton from "../components/cgpa/AddLevelButton";
import LevelsSkeleton from "../components/ui/LevelsSkeleton";

export default function Levels() {
  const navigate = useNavigate();

  const [levels, setLevels] = useState([]);
  const [academicCourses, setAcademicCourses] = useState([]); // flattened courses
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ───────── FETCH LEVELS + COURSES ───────── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserId(session.user.id);

        const { data: levelData, error: levelError } = await supabase
          .from("levels")
          .select(`
            id,
            level,
            semesters (
              id,
              semester,
              courses (
                code,
                unit,
                point
              )
            )
          `)
          .eq("user_id", session.user.id)
          .order("level");

        if (levelError) throw levelError;

        setLevels(levelData || []);

        // Flatten all courses for CGPA calculation
        const allCourses = [];
        levelData.forEach((lvl) => {
          lvl.semesters?.forEach((sem) => {
            sem.courses?.forEach((course) => {
              allCourses.push({
                ...course,
                levelId: lvl.id,
                semesterId: sem.id,
              });
            });
          });
        });

        setAcademicCourses(allCourses);
      } catch (err) {
        console.error("Failed to fetch levels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  /* ───────── CARRYOVER-AWARE CGPA PER LEVEL ───────── */
  const levelStats = useMemo(() => {
    const normalize = (code) => code?.toUpperCase().replace(/\s+/g, "") || "";
    const grouped = {};

    academicCourses.forEach((course) => {
      const code = normalize(course.code);
      if (!grouped[code]) grouped[code] = [];
      grouped[code].push(course);
    });

    const resolved = [];
    Object.values(grouped).forEach((attempts) => {
      // Sort by point descending → best attempt first
      attempts.sort((a, b) => (b.point || 0) - (a.point || 0));

      const best = attempts[0];

      // Keep unit from the earliest attempt (original semester)
      const original = attempts.reduce((a, b) =>
        a.semesterId < b.semesterId ? a : b
      );

      resolved.push({
        ...original,
        point: best.point || 0,
      });
    });

    // Sum totals per level
    const map = {};
    resolved.forEach((c) => {
      const levelId = c.levelId;
      if (!map[levelId]) map[levelId] = { units: 0, points: 0 };
      map[levelId].units += c.unit || 0;
      map[levelId].points += (c.unit || 0) * (c.point || 0);
    });

    return map;
  }, [academicCourses]);

  /* ───────── UI ───────── */
  if (loading) return <LevelsSkeleton />;

  return (
    <div className="min-h-screen p-8 
      bg-gradient-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">

      <Header title="Levels" subtitle="Your academic levels overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-[144px] px-3 h-[calc(100vh-70px)] overflow-y-auto scrollbar-hide">
        {levels.map((lvl) => {
          const stats = levelStats[lvl.id] || { units: 0, points: 0 };
          const cgpa = stats.units ? stats.points / stats.units : 0;

          return (
            <LevelCard
              key={lvl.id}
              level={lvl.level}
              gpa={cgpa} // carryover-aware CGPA
              onClick={() =>
                navigate("/semester", { state: { level: lvl.level } })
              }
            />
          );
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
