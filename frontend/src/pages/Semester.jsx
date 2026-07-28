import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { FaArrowLeft } from "react-icons/fa";
import SemesterCard from "../components/cgpa/SemesterCard";
import SemesterSkeleton from "../components/ui/SemesterSkeleton";
import { useQuery } from "@tanstack/react-query";
import { getSemesters } from "../queries/semesterQueries";
import { calculateSemesterStats } from "../services/academic";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteSemester,
  refreshAcademicData,
} from "../services/academic";
import DeleteModal from "../components/admin/DeleteModal";

export default function Semester() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const levelNumber = location.state?.level ?? null;

  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Guard
  useEffect(() => {
    if (!levelNumber) navigate("/levels");
  }, [levelNumber, navigate]);

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ["semesters", levelNumber],
    queryFn: () => getSemesters(levelNumber),
    enabled: levelNumber !== null,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const level = data?.level;
  const semesters = data?.semesters ?? [];

  const semesterStats = calculateSemesterStats([
    {
      id: level?.id,
      semesters,
    },
  ]);

  // Add semester
  const addSemester = async () => {
    if (isAdding) return;
    setIsAdding(true);
    setMessage("");

    const lastSemester = semesters.at(-1);
    const lastStats = lastSemester
      ? semesterStats[lastSemester.id]
      : null;
    
    if (lastSemester && lastStats?.units === 0) {
      setMessage("Calculate GPA for the last semester first");
      setIsAdding(false);
      return;
    }

    const nextSemester = lastSemester ? lastSemester.semester + 1 : 1;

    try {
      const { error } = await supabase
        .from("semesters")
        .insert({
          level_id: level.id,
          semester: nextSemester,
          gpa: null,
          total_units: 0,
        });
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({
        queryKey: ["semesters", levelNumber],
      });
      
      setMessage(`Semester ${nextSemester} added`);
    } catch {
      setMessage("Failed to add semester");
    } finally {
      setIsAdding(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDeleteSemester = async () => {
    if (!selectedSemester) return;
    const highestSemester = Math.max(
      ...semesters.map((s) => s.semester)
    );
    
    if (selectedSemester.semester !== highestSemester) {
      toast.error(
        `Only Semester ${highestSemester} can be deleted.`
      );
      return;
    }
    try {
      setIsDeleting(true);
  
      await deleteSemester(selectedSemester.id);
      
      await refreshAcademicData({
        queryClient,
        level: levelNumber,
      });
      
      toast.success("Semester deleted successfully");
  
      setShowDeleteModal(false);
      setSelectedSemester(null);
  
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete semester");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 
      bg-linear-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]">

      {/* Header */}
      <div className="fixed top-6 left-4 flex items-center gap-3 bg-white/20 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-3xl z-50">
        <button onClick={() => navigate("/levels")}>
          <FaArrowLeft className="text-white hover:scale-110 transition-transform duration-300 ease-out hover:translate-x-0.5 cursor-pointer" />
        </button>
        <h1 className="text-white font-bold">{level ? `${level?.level} Level Semesters` : "___ Level Semesters"}</h1>
      </div>

      {/* Semesters Grid */}
      {isLoading ? <SemesterSkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-32">
          {semesters.map(sem => {
            const stats = semesterStats[sem.id];
            const highestSemester =
              semesters.length > 0
                ? Math.max(...semesters.map((s) => s.semester))
                : null;
            return (
              <SemesterCard
                key={sem.id}
                name={`${sem.semester}${["th", "st", "nd", "rd"][sem.semester] || "th"} Semester`}
                gpa={stats?.gpa?.toFixed(2) || "0.00"}
                onClick={() => navigate("/courses", {
                  state: { level: level.level, semester: sem.semester, semesterId: sem.id }
                })}
                canDelete={sem.semester === highestSemester}
                onDelete={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                  setSelectedSemester(sem);
                }}
                isDeleting={isDeleting}
                className="cursor-pointer hover:scale-105 transition bg-white/30 dark:bg-white/10 backdrop-blur-md rounded-3xl p-6"
              />
            );
          })}
  
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
      )}      

      {message && <p className="text-center text-white mt-4">{message}</p>}

      <DeleteModal
        open={showDeleteModal}
        loading={isDeleting}
        title="Delete Semester"
        description="Are you sure you want to delete"
        warning="Deleting this semester will also delete all courses inside it."
        itemName={`${selectedSemester?.semester === 1 ? "First" : selectedSemester?.semester === 2 ? "Second" : "Third"} Semester `}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSemester}
      />
    </div>
  );
}