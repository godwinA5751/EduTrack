import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import LevelCard from "../components/cgpa/LevelCard";
import Header from "../components/layout/Header";
import AddLevelButton from "../components/cgpa/AddLevelButton";
import LevelsSkeleton from "../components/ui/LevelsSkeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLevels } from "../queries/levelQueries";
import {
  deleteLevel,
  refreshAcademicData,
} from "../services/academic";
import DeleteModal from "../components/admin/DeleteModal";

export default function Levels() {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["levels"],
    queryFn: getLevels,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const levels = data?.levels ?? [];
  const levelStats = data?.stats ?? {};
  const userId = data?.userId ?? null;

  useEffect(() => {
    if (error?.message === "Not authenticated") {
      navigate("/login", { replace: true });
    }
  }, [error, navigate]);

  const handleDeleteLevel = async () => {
    if (!selectedLevel) return;
    const highestLevel = Math.max(...levels.map((l) => l.level));
    
    if (selectedLevel.level !== highestLevel) {
      toast.error(
        `Only the highest level (${highestLevel}) can be deleted.`
      );
      return;
    }
    try {
      setIsDeleting(true);
  
      await deleteLevel(selectedLevel.id);
      
      await refreshAcademicData({
        queryClient,
        levels,
      });
      
      toast.success("Level deleted successfully");
  
      setShowDeleteModal(false);
      setSelectedLevel(null);
  
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete semester");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ───────── UI ───────── */

  return (
    <div className="min-h-screen p-8 
      bg-linear-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">

      <Header title="Levels" subtitle="Your academic levels overview" />

      {isLoading ? <LevelsSkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-36 px-3 h-[calc(100vh-70px)] overflow-y-auto scrollbar-hide">
          {levels.map((lvl) => {
            const stats = levelStats[lvl.id] || {
              units: 0,
              points: 0,
              gpa: 0,
            };
            const highestLevel = Math.max(...levels.map((l) => l.level));
            return (
              <LevelCard
                key={lvl.id}
                level={lvl.level}
                gpa={stats.gpa} // carryover-aware CGPA
                onClick={() =>
                  navigate("/semester", { state: { level: lvl.level } })
                }
                canDelete={lvl.level === highestLevel}
                onDelete={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                  setSelectedLevel(lvl)
                }}
                loading={isDeleting}
              />
            );
          })}
  
          {userId && (
            <AddLevelButton
              userId={userId}
              levels={levels}
              levelStats={levelStats}
            />
          )}
        </div>
      )}

      <DeleteModal
        open={showDeleteModal}
        loading={isDeleting}
        title="Delete Level"
        description="Are you sure you want to delete"
        itemName={`${selectedLevel?.level} Level`}
        warning="Deleting this level will also delete all semesters and courses inside it."
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteLevel}
      />
    </div>
  );
}
