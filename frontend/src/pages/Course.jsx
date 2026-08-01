import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaEdit } from "react-icons/fa";
import CoursesSkeleton from "../components/ui/CoursesSkeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCourses } from "../queries/courseQueries";
import {
  buildCourse,
  validateCourse,
  GRADE_POINTS,
  refreshAcademicData,
  addCourse,
  deleteCourse,
  updateCourse,
} from "../services/academic";
import EditCourseModal from "../components/cgpa/EditCourseModal";


export default function Courses() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { level, semester, semesterId } = location.state || {};

  
  const [form, setForm] = useState({ code: "", unit: "", grade: "" });
  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const showMessage = (text) => {
      setMessage(text);
      setTimeout(() => setMessage(""), 2500);
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editForm, setEditForm] = useState({
    code: "",
    unit: "",
    grade: "",
  });

  const {
    data: courses = [],
    isLoading,
  } = useQuery({
    queryKey: ["courses", semesterId],
    queryFn: () => getCourses(semesterId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const openEditModal = (course) => {
    setSelectedCourse(course);
  
    setEditForm({
      code: course.code,
      unit: course.unit,
      grade: course.grade,
    });
  
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ───────────────────────── GUARD ───────────────────────── */

  useEffect(() => {
    if (!semesterId || !level || !semester) {
      navigate("/levels");
    }
  }, [semesterId, level, semester, navigate]);
  
  /* ───────────────────────── HANDLERS ───────────────────────── */

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ───────────────────────── ADD COURSE (OPTIMISTIC) ───────────────────────── */

  const addCourseHandler = async () => {
    const validationError = validateCourse(form);
    if (validationError) {
      showMessage(validationError);
      return;
    }

    const normalizedCode = form.code.trim().toUpperCase();
    
    const courseExists = courses.some(
      (course) =>
        course.code.trim().toUpperCase() === normalizedCode
    );
    
    if (courseExists) {
      showMessage("Course already exists in this semester.");
      return;
    }

    const newCourse = buildCourse(form, semesterId);
    if (isAdding) return;

    setIsAdding(true);

    try {
      await addCourse(newCourse);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      await supabase.rpc("sync_carryovers", {
        p_user_id: session.user.id,
      });
      
      setForm({ code: "", unit: "", grade: "" });
      
      await refreshAcademicData({
        queryClient,
        semesterId,
        level,
      });

      showMessage("Course added successfully ✅");

    } catch (err) {
      console.error("Add failed:", err);
      showMessage("Failed to add course");
    } finally {
      setIsAdding(false);
    }
  };

  /* ───────────────────────── DELETE COURSE (OPTIMISTIC) ───────────────────────── */

  const deleteCourseHandler = async (id) => {
    if (isDeleting) return;
  
    setIsDeleting(true);
  
    try {
      await deleteCourse(id);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      await supabase.rpc("sync_carryovers", {
        p_user_id: session.user.id,
      });
      
      await refreshAcademicData({
        queryClient,
        semesterId,
        level,
      });
      showMessage("Course deleted successfully ✅");
  
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateCourseHandler = async () => {
    const validationError = validateCourse(editForm);
  
    if (validationError) {
      showMessage(validationError);
      return;
    }

    const normalizedCode = editForm.code.trim().toUpperCase();
    
    const courseExists = courses.some(
      (course) =>
        course.id !== selectedCourse.id &&
        course.code.trim().toUpperCase() === normalizedCode
    );
    
    if (courseExists) {
      showMessage("Course already exists in this semester.");
      return;
    }
  
    try {
      setIsUpdating(true);
  
      await updateCourse(selectedCourse.id, editForm);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      await supabase.rpc("sync_carryovers", {
        p_user_id: session.user.id,
      });
  
      await refreshAcademicData({
        queryClient,
        semesterId,
        level,
      });
  
      showMessage("Course updated successfully ✅");
  
      setShowEditModal(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error(err);
      showMessage("Failed to update course");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen p-8 
      bg-linear-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">
      {/* Header */}
      <div className="flex items-center gap-3 fixed top-6 left-4 z-50 bg-white/20 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-3xl">
        <button onClick={() => navigate("/semester", { state: { level } })}>
          <FaArrowLeft className="text-white cursor-pointer hover:scale-110 transition-transform duration-300 ease-out hover:translate-x-0.5" />
        </button>
        <h1 className="text-white font-bold">
          {level} Level – {semester}
          {semester === 1 ? "st" : semester === 2 ? "nd" : semester === 3 ? "rd" : "th"} Semester
        </h1>
      </div>

      {/* Form */}
      {isLoading ? <CoursesSkeleton /> : (
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
            <button disabled={isAdding || isDeleting} onClick={addCourseHandler} className="btn bg-white/20 dark:bg-white/5 px-4 py-2 cursor-pointer rounded-xl text-white hover:bg-white/30 dark:hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed">
              {isAdding ? "Adding..." : "Add Course"}
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
                <span>
                  {c.code}
                  {c.is_carryover && (
                    <span className="ml-2 text-xs text-yellow-300">🔁</span>
                  )}
                </span>
                <span className="text-center">{c.unit}</span>
                <span className="text-center">{c.grade}</span>
                <span className="flex justify-center gap-4">
                  <FaEdit
                    onClick={() => openEditModal(c)}
                    className={`
                      transition
                      ${
                        isDeleting || isAdding
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:text-blue-300"
                      }
                    `}
                  />
                
                  <FaTrash
                    onClick={() => deleteCourseHandler(c.id)}
                    className={`
                      transition
                      ${
                        isDeleting || isAdding
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:text-red-400"
                      }
                    `}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <EditCourseModal
        open={showEditModal}
        form={editForm}
        loading={isUpdating}
        onChange={handleEditChange}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedCourse(null);
          setEditForm({
            code: "",
            unit: "",
            grade: "",
          });
        }}
        onConfirm={updateCourseHandler}
      />
    </div>
  );
}
