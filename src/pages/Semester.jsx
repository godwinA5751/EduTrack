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

  // Guard
  useEffect(() => {
    if (!levelNumber) navigate("/levels");
  }, [levelNumber, navigate]);

  // Fetch Level + Semesters + Courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        // Fetch level
        const { data: levelData, error } = await supabase
          .from("levels")
          .select("id, level")
          .eq("user_id", session.user.id)
          .eq("level", levelNumber)
          .single();
        if (error) throw error;
        setLevel(levelData);

        // Fetch semesters + courses
        const { data: semesterData, error: semError } = await supabase
          .from("semesters")
          .select(`
            id,
            semester,
            gpa,
            total_units,
            courses (
              id,
              code,
              unit,
              point
            )
          `)
          .eq("level_id", levelData.id)
          .order("semester");

        if (semError) throw semError;

        // ✅ Calculate carryovers immediately
        const updatedSemesters = applyCarryovers(semesterData || []);
        setSemesters(updatedSemesters);

      } catch {
        setMessage("Failed to load semesters");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [levelNumber, navigate]);

  // Add semester
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
          gpa: null,
          total_units: 0,
        })
        .select()
        .single();
      if (error) throw error;

      setSemesters(prev => [...prev, data]);
      setMessage(`Semester ${nextSemester} added`);
    } catch {
      setMessage("Failed to add semester");
    } finally {
      setIsAdding(false);
    }
  };

  // Function to apply carryovers like in Profile.jsx
  const applyCarryovers = (semesterList) => {
    // 1️⃣ Flatten all courses WITH semester number
    const allCourses = [];

    semesterList.forEach((sem) => {
      sem.courses?.forEach((course) => {
        allCourses.push({
          ...course,
          semesterId: sem.id,
          semesterNumber: sem.semester, // ✅ CRITICAL FIX
        });
      });
    });

    // 2️⃣ Normalize
    const normalize = (code) =>
      code?.toUpperCase().replace(/\s+/g, "") || "";

    // 3️⃣ Group by course code
    const grouped = {};

    allCourses.forEach((c) => {
      const key = normalize(c.code);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    // 4️⃣ Resolve carryovers properly
    const resolved = {};

    Object.values(grouped).forEach((attempts) => {
      // best grade
      attempts.sort((a, b) => (b.point || 0) - (a.point || 0));
      const best = attempts[0];

      // 🔥 ORIGINAL ATTEMPT (by semester number, NOT id)
      const original = attempts.reduce((a, b) =>
        a.semesterNumber < b.semesterNumber ? a : b
      );

      resolved[normalize(original.code)] = best.point || 0;
    });

    // 5️⃣ Apply to semesters
    const updatedSemesters = semesterList.map((sem) => {
      const updatedCourses =
        sem.courses?.map((c) => {
          const key = normalize(c.code);

          return {
            ...c,
            point: resolved[key] ?? c.point ?? 0,
          };
        }) || [];

      const totalPoints = updatedCourses.reduce(
        (sum, c) => sum + (c.point || 0) * (c.unit || 0),
        0
      );

      const totalUnits = updatedCourses.reduce(
        (sum, c) => sum + (c.unit || 0),
        0
      );

      const gpa = totalUnits ? totalPoints / totalUnits : 0;

      return {
        ...sem,
        courses: updatedCourses,
        totalPoints,
        totalUnits,
        gpa,
      };
    });

    return updatedSemesters;
  };

  if (loading) return <SemesterSkeleton />;

  return (
    <div className="min-h-screen p-8 
      bg-gradient-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">

      {/* Header */}
      <div className="fixed top-6 left-4 flex items-center gap-3 bg-white/20 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-3xl z-50">
        <button onClick={() => navigate("/levels")}>
          <FaArrowLeft className="text-white hover:scale-110 transition-transform duration-300 ease-out hover:translate-x-[-10px] cursor-pointer" />
        </button>
        <h1 className="text-white font-bold">{level?.level} Level Semesters</h1>
      </div>

      {/* Semesters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-32">
        {semesters.map(sem => (
          <SemesterCard
            key={sem.id}
            name={`${sem.semester}${["th", "st", "nd", "rd"][sem.semester] || "th"} Semester`}
            gpa={sem.gpa?.toFixed(2) || "0.00"}
            onClick={() => navigate("/courses", {
              state: { level: level.level, semester: sem.semester, semesterId: sem.id }
            })}
            className="cursor-pointer hover:scale-105 transition bg-white/30 dark:bg-white/10 backdrop-blur-md rounded-3xl p-6"
          />
        ))}

        {/* Add Semester */}
        {semesters.length < 3 && (
          <div
            onClick={addSemester}
            className={`flex items-center justify-center h-40 rounded-3xl border-2 border-dashed border-white/60 dark:border-white/10 text-white cursor-pointer hover:bg-white/10 dark:hover:bg-white/10 transition
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