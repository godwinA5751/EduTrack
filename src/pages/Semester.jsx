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

  /* ───────── Guard ───────── */

  useEffect(() => {
    if (!levelNumber) navigate("/levels");
  }, [levelNumber, navigate]);

  /* ───────── Fetch ───────── */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const { data: levelData, error } = await supabase
          .from("levels")
          .select("id, level")
          .eq("user_id", session.user.id)
          .eq("level", levelNumber)
          .single();

        if (error) throw error;
        setLevel(levelData);

        const { data: semesterData } = await supabase
          .from("semesters")
          .select("*")
          .eq("level_id", levelData.id)
          .order("semester");

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
    const lastSemester = semesters.at(-1);

    if (lastSemester && lastSemester.total_units === 0) {
      setMessage("Calculate GPA for the last semester first");
      return;
    }

    const nextSemester = lastSemester ? lastSemester.semester + 1 : 1;

    try {
      const { data, error } = await supabase
        .from("semesters")
        .insert({
          level_id: level.id,
          semester: nextSemester,
          gpa: null,
          total_units: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // 🚀 Optimistic update (NO refetch)
      setSemesters((prev) => [...prev, data]);
      setMessage(`Semester ${nextSemester} added`);
    } catch {
      setMessage("Failed to add semester");
    }
  };

  /* ───────── UI ───────── */

  if (loading) return <SemesterSkeleton />;

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]">
      <div className="fixed top-6 left-4 flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-3xl z-50">
        <button onClick={() => navigate("/levels")}>
          <FaArrowLeft className="text-white hover:scale-110 transition-transform  duration-300 ease-out hover:translate-x-[-10px] cursor-pointer" />
        </button>
        <h1 className="text-white font-bold">{level.level} Level Semesters</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-32">
        {semesters.map((sem) => (
          <SemesterCard
            key={sem.id}
            name={`${sem.semester}${["th", "st", "nd", "rd"][sem.semester] || "th"} Semester`}
            gpa={sem.gpa ? sem.gpa.toFixed(2) : "0.00"}
            onClick={() =>
              navigate("/courses", {
                state: {
                  level: level.level,
                  semester: sem.semester,
                  semesterId: sem.id,
                },
              })
            }
            className="cursor-pointer hover:scale-105 transition bg-white/30 backdrop-blur-md rounded-3xl p-6"
          />
        ))}

        {semesters.length < 3 && (
          <div
            onClick={addSemester}
            className="flex items-center justify-center h-40 rounded-3xl border-2 border-dashed border-white/60 text-white cursor-pointer hover:bg-white/10 transition"
          >
            + Add Semester
          </div>
        )}
      </div>

      {message && <p className="text-center text-white mt-4">{message}</p>}
    </div>
  );
}
