import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaTrash } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import CoursesSkeleton from "../components/ui/CoursesSkeleton";

const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

export default function Courses() {
  const navigate = useNavigate();
  const location = useLocation();

  const { level, semester, semesterId } = location.state || {};

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: "", unit: "", grade: "" });
  const [message, setMessage] = useState("");

  /* ───────────────────────── GUARD ───────────────────────── */

  useEffect(() => {
    if (!semesterId || !level || !semester) {
      navigate("/levels");
    }
  }, [semesterId, level, semester, navigate]);

  /* ───────────────────────── FETCH COURSES (SINGLE SOURCE) ───────────────────────── */

  const fetchCourses = useCallback(async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("semester_id", semesterId)
      .order("created_at", { ascending: true });

    if (!error) {
      setCourses(data || []);
    }
  }, [semesterId]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      await fetchCourses();
      setLoading(false);
    };

    init();
  }, [fetchCourses, navigate]);

  /* ───────────────────────── HANDLERS ───────────────────────── */

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ───────────────────────── ADD COURSE (OPTIMISTIC) ───────────────────────── */
  //   if (!form.code || !form.unit || !form.grade) {
  //     setMessage("Fill all fields");
  //     setTimeout(() => setMessage(""), 2500);
  //     return;
  //   }

  //   const pattern = /^[A-Z]{3}\s?\d{3}$/i;
  //   if (!pattern.test(form.code)) {
  //     setMessage("Invalid course code");
  //     setTimeout(() => setMessage(""), 2500);
  //     return;
  //   }

  //   function normalizeCode(code) {
  //     return code.toUpperCase().replace(/(\D)(\d+)/, '$1 $2');
  //   }

  //   const newCourse = {
  //     semester_id: semesterId,
  //     code: normalizeCode(form.code),
  //     unit: Number(form.unit),
  //     grade: form.grade,
  //     point: GRADE_POINTS[form.grade],
  //   };

  //   const { data, error } = await supabase
  //     .from("courses")
  //     .insert(newCourse)
  //     .select()
  //     .single();

  //   if (!error && data) {
  //     setCourses((prev) => [...prev, data]);
  //     setForm({ code: "", unit: "", grade: "" });
  //     setMessage("");
  //   } else {
  //     setMessage("Failed to add course");
  //     setTimeout(() => setMessage(""), 2500);
  //   }
  // };

  function normalizeCode(code) {
    return code.toUpperCase().replace(/(\D)(\d+)/, '$1 $2');
  }

  const addCourse = async () => {
    if (!form.code || !form.unit || !form.grade) {
      setMessage("Fill all fields");
      setTimeout(() => setMessage(""), 2500);
      return;
    }

    const pattern = /^[A-Z]{3}\s?\d{3}$/i;

    const cleanedCode = normalizeCode(form.code);

    if (!pattern.test(cleanedCode.replace(" ", ""))) {
      setMessage("Invalid course code (e.g MTH101)");
      setTimeout(() => setMessage(""), 2500);
      return;
    }

    const newCourse = {
      semester_id: semesterId,
      code: cleanedCode,
      unit: Number(form.unit),
      grade: form.grade,
      point: GRADE_POINTS[form.grade],
    };

    try {
      // 1. Insert into DB
      const { data, error } = await supabase
        .from("courses")
        .insert(newCourse)
        .select()
        .single();

      if (error) throw error;

      // 2. Update UI immediately
      const updatedCourses = [...courses, data];
      setCourses(updatedCourses);

      // 3. Reset form
      setForm({ code: "", unit: "", grade: "" });

      // 4. 🔥 Recalculate GPA (VERY IMPORTANT)
      await calculateAndPersistGPA();

    } catch (err) {
      console.error("Add failed:", err);
      setMessage("Failed to add course");
      setTimeout(() => setMessage(""), 2500);
    }
  };

  /* ───────────────────────── DELETE COURSE (OPTIMISTIC) ───────────────────────── */

  const deleteCourse = async (id) => {
    // 1. Save current state (for rollback)
    const previousCourses = [...courses];

    // 2. Optimistically update UI
    setCourses((prev) => prev.filter((course) => course.id !== id));

    try {
      // 3. Delete from DB
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // 4. 🔥 Recalculate GPA AFTER successful delete
      await calculateAndPersistGPA();

    } catch (err) {
      console.error("Delete failed:", err);

      // 5. Rollback UI if error
      setCourses(previousCourses);
    }
  };

  /* ───────────────────────── GPA + CGPA ───────────────────────── */

  const calculateAndPersistGPA = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      /* ───────────── 1. GET ALL COURSES FOR USER ───────────── */

      const { data: allCourses, error } = await supabase
        .from("courses")
        .select(`
          id,
          code,
          unit,
          point,
          created_at,
          semester_id,
          semesters:semester_id(
            id,
            level_id,
            levels:level_id(user_id)
          )
        `)
        .eq("semesters.levels.user_id", session.user.id);

      if (error) throw error;

      /* ───────────── 2. NORMALIZE FUNCTION ───────────── */

      const normalize = (code) =>
        code.toUpperCase().replace(/\s+/g, "");

      /* ───────────── 3. GROUP BY COURSE CODE ───────────── */

      const grouped = {};

      allCourses.forEach((c) => {
        const key = normalize(c.code);

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
      });

      /* ───────────── 4. RESOLVE BEST ATTEMPT ───────────── */

      const resolvedCourses = [];

      Object.values(grouped).forEach((attempts) => {

        // Best grade attempt
        const best = attempts.reduce((prev, curr) =>
          prev.point > curr.point ? prev : curr
        );

        // First time course was taken
        const original = attempts.reduce((prev, curr) =>
          new Date(prev.created_at) < new Date(curr.created_at)
            ? prev
            : curr
        );

        resolvedCourses.push({
          ...original,
          point: best.point,
        });

      });

      /* ───────────── 5. CALCULATE GPA PER LEVEL ───────────── */

      const levelMap = {};

      resolvedCourses.forEach((c) => {
        const levelId = c.semesters.level_id;

        if (!levelMap[levelId]) {
          levelMap[levelId] = { points: 0, units: 0 };
        }

        levelMap[levelId].points += c.point * c.unit;
        levelMap[levelId].units += c.unit;
      });

      /* ───────────── 6. UPDATE LEVEL CGPA ───────────── */

      for (const levelId in levelMap) {
        const { points, units } = levelMap[levelId];

        const cgpa = units ? points / units : 0;

        await supabase
          .from("levels")
          .update({ cgpa })
          .eq("id", levelId);
      }

      /* ───────────── 7. UPDATE CURRENT SEMESTER GPA ───────────── */

      // 🔥 GROUP BY SEMESTER
      const semesterMap = {};

      resolvedCourses.forEach((c) => {
        const semId = c.semester_id;

        if (!semesterMap[semId]) {
          semesterMap[semId] = { points: 0, units: 0 };
        }

        semesterMap[semId].points += c.point * c.unit;
        semesterMap[semId].units += c.unit;
      });

      // 🔥 UPDATE EACH SEMESTER GPA
      for (const semId in semesterMap) {
        const { points, units } = semesterMap[semId];
        const gpa = units ? points / units : 0;

        await supabase
          .from("semesters")
          .update({
            gpa,
            total_units: units,
          })
          .eq("id", semId);
      }

      /* ───────────── 8. SUCCESS MESSAGE ───────────── */

      setMessage("GPA updated successfully ✅");
      setTimeout(() => setMessage(""), 2500);

    } catch (err) {
      console.error("GPA ERROR:", err);
      setMessage("Failed to calculate GPA");
      setTimeout(() => setMessage(""), 2500);
    }
  };

  if (loading) return <CoursesSkeleton />;

  return (
    <div className="min-h-screen p-8 
      bg-gradient-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">
      {/* Header */}
      <div className="flex items-center gap-3 fixed top-6 left-4 z-50 bg-white/20 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-3xl">
        <button onClick={() => navigate("/semester", { state: { level } })}>
          <FaArrowLeft className="text-white cursor-pointer hover:scale-110 transition-transform duration-300 ease-out hover:translate-x-[-10px]" />
        </button>
        <h1 className="text-white font-bold">
          {level} Level – {semester}
          {semester === 1 ? "st" : semester === 2 ? "nd" : semester === 3 ? "rd" : "th"} Semester
        </h1>
      </div>

      {/* Form */}
      <div className="grid lg:grid-cols-2 gap-6 mt-24">
        <div className="bg-white/20 dark:bg-white/5 p-6 rounded-xl space-y-3 text-center">
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <input name="code" value={form.code} onChange={handleChange} placeholder="Course (e.g MTH101)" className="input bg-white/30 dark:bg-white/10 text-white placeholder-white/70 rounded-xl px-4 py-1 w-60 sm:w-40" />
            <input name="unit" type="number" value={form.unit} onChange={handleChange} placeholder="Unit" className="input bg-white/30 dark:bg-white/10 text-white placeholder-white/70 rounded-xl px-4 py-1 w-60 sm:w-40" />
            <select name="grade" value={form.grade} onChange={handleChange} className="input bg-white/30 dark:bg-white/10 text-white rounded-xl px-4 py-1 w-60 sm:w-40">
              <option value="" disabled>Grade</option>
              {Object.keys(GRADE_POINTS).map(g => (
                <option className="text-black/60" key={g}>{g}</option>
              ))}
            </select>
          </div>
          <button onClick={addCourse} className="btn bg-white/20 dark:bg-white/5 px-4 py-2 cursor-pointer rounded-xl text-white hover:bg-white/30 dark:hover:bg-white/10 transition">
            Add Course
          </button>
          {message && <p className="text-white">{message}</p>}
        </div>

        {/* Courses */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 items-center bg-white/20 dark:bg-white/5 p-3 rounded-xl text-white font-semibold">
            <span>Courses</span>
            <span className="text-center">Units</span>
            <span className="text-center">Grade</span>
            <span className="text-center">Actions</span>
          </div>

          {courses.map((c) => (
            <div key={c.id} className="grid grid-cols-4 items-center bg-white/20 dark:bg-white/5 p-3 rounded-xl text-white">
              <span>{c.code}</span>
              <span className="text-center">{c.unit}</span>
              <span className="text-center">{c.grade}</span>
              <span className="text-center"><FaTrash onClick={() => deleteCourse(c.id)} className="mx-auto cursor-pointer hover:text-red-400 transition" /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
