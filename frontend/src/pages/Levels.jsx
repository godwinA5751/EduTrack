import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import LevelCard from "../components/cgpa/LevelCard";
import Header from "../components/layout/Header";
import AddLevelButton from "../components/cgpa/AddLevelButton";
import LevelsSkeleton from "../components/ui/LevelsSkeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLevels } from "../queries/levelQueries";
import { getCurrentUser } from "../queries/userQueries";
import {
  deleteLevel,
  refreshAcademicData,
  enqueueAcademicMutation,
} from "../services/academic";
import DeleteModal from "../components/admin/DeleteModal";

export default function Levels() {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  
  const navigate = useNavigate();
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });

  const userId = currentUser?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["levels", userId],
    queryFn: getLevels,
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  const levels = data?.levels ?? [];
  const levelStats = data?.stats ?? {};

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

      if (!navigator.onLine) {
        const semesterIds = (selectedLevel.semesters || []).map(
          (semester) => semester.id
        );

        // Queue graduation status reset first.
        await enqueueAcademicMutation(userId, {
          type: "profile.update",
          profileId: userId,
          payload: { graduated: false },
        });

        // Queue level deletion and remove descendant mutations.
        await enqueueAcademicMutation(userId, {
          type: "level.delete",
          levelId: selectedLevel.id,
          semesterIds,
        });

        // Remove the level from the cached levels.
        queryClient.setQueryData(
          ["levels", userId],
          (old) => {
            if (!old?.levels) return old;

            const remainingLevels = old.levels.filter(
              (level) => level.id !== selectedLevel.id
            );

            const remainingStats = { ...old.stats };
            delete remainingStats[selectedLevel.id];

            return {
              ...old,
              levels: remainingLevels,
              stats: remainingStats,
            };
          }
        );

        // Update graduation status cache.
        queryClient.setQueryData(
          ["graduation-status", userId],
          false
        );

        // Remove cached semester and course data.
        for (const semesterId of semesterIds) {
          queryClient.removeQueries({
            queryKey: ["courses", semesterId, userId],
          });
        }

        queryClient.removeQueries({
          queryKey: ["semesters", selectedLevel.level, userId],
        });

        toast.success("Level deleted offline. Waiting to sync.");

        setShowDeleteModal(false);
        setSelectedLevel(null);
        return;
      }

      // Existing online deletion flow.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ graduated: false })
        .eq("id", userId);

      if (profileError) throw profileError;

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
      toast.error("Failed to delete level");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 
      bg-linear-to-br 
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] overflow-hidden">

      <Header title="Levels" subtitle="Your academic levels overview" />

      {!currentUser || isLoading ? <LevelsSkeleton /> : (
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
                  navigate(`/semester?level=${lvl.level}`)
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
