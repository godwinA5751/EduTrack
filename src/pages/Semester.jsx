import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { FaArrowLeft } from "react-icons/fa";
import SemesterCard from "../components/cgpa/SemesterCard";
import SemesterSkeleton from "../components/ui/SemesterSkeleton";

export default function Semester() {
  const navigate = useNavigate();
  const location = useLocation();
  const levelNumber = location.state?.level;

  const [level, setLevel] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  /* ───────── Guard ───────── */
  useEffect(() => {
    if (!levelNumber) navigate("/levels");
  }, [levelNumber, navigate]);

  /* ───────── Fetch Level & Semesters ───────── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        const userId = session.user.id;

        // 1️⃣ Fetch the level
        const { data: levelData, error: levelError } = await supabase
          .from("levels")
          .select("id, level")
          .eq("user_id", userId)
          .eq("level", levelNumber)
          .single();
        if (levelError) throw levelError;
        setLevel(levelData);

        // 2️⃣ Fetch semesters (use GPA from DB directly)
        const { data: semesterData, error: semError } = await supabase
          .from("semesters")
          .select("*")
          .eq("level_id", levelData.id)
          .order("semester");
        if (semError) throw semError;

        setSemesters(semesterData || []);
      } catch {
        setMessage("Failed to load semesters");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [levelNumber, navigate]);

  /* ───────── Add Semester ───────── */
  const addSemester = async () => {
    if (isAdding) return;
    setIsAdding(true);
    setMessage("");

    const lastSemester = semesters.at(-1);
    if (lastSemester && lastSemester.total_units === 0) {
      setMessage("Calculate GPA for the last semester first");
      setIsAdding(false);
      return;
    }

    const nextSemester = lastSemester ? lastSemester.semester + 1 : 1;

    try {
      const { data, error } = await supabase
        .from("semesters")
        .insert({
          level_id: level.id,
          semester: nextSemester,
          gpa: 0,          // default GPA
          total_units: 0,  // default units
        })
        .select()
        .single();
      if (error) throw error;

      setSemesters((prev) => [...prev, data]);
      setMessage(`Semester ${nextSemester} added`);
    } catch {
      setMessage("Failed to add semester");
    } finally {
      setIsAdding(false);
    }
  };

  /* ───────── UI ───────── */
  if (loading) return <SemesterSkeleton />;

  return (
    <div className="min-h-screen p-8 
      bg-gradient-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">
      
      {/* Header */}
      <div className="fixed top-6 left-4 flex items-center gap-3 bg-white/20 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-3xl z-50">
        <button onClick={() => navigate("/levels")}>
          <FaArrowLeft className="text-white hover:scale-110 transition-transform duration-300 ease-out hover:translate-x-[-2px] cursor-pointer" />
        </button>
        <h1 className="text-white font-bold">{level.level} Level Semesters</h1>
      </div>

      {/* Semester Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-32">
        {semesters.map((sem) => (
          <SemesterCard
            key={sem.id}
            name={`${sem.semester}${["th","st","nd","rd"][sem.semester] || "th"} Semester`}
            gpa={sem.gpa?.toFixed(2) || "0.00"} // ✅ Use DB GPA directly
            onClick={() =>
              navigate("/courses", {
                state: { level: level.level, semester: sem.semester, semesterId: sem.id },
              })
            }
            className="cursor-pointer hover:scale-105 transition bg-white/30 dark:bg-white/10 backdrop-blur-md rounded-3xl p-6"
          />
        ))}

        {semesters.length < 3 && (
          <div
            onClick={addSemester}
            disabled={isAdding}
            className={`
              flex items-center justify-center h-40 rounded-3xl border-2 border-dashed border-white/60 dark:border-white/10 text-white cursor-pointer hover:bg-white/10 dark:hover:bg-white/10 transition
              ${isAdding ? 'cursor-not-allowed text-gray-500 border-gray-200 dark:border-gray-800' : 'hover:border-white/80'}
            `}
          >
            + Add Semester
          </div>
        )}
      </div>

      {message && <p className="text-center text-white mt-4">{message}</p>}
    </div>
  );
}