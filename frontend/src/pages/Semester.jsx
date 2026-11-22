
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { FaArrowLeft } from "react-icons/fa";
import SemesterCard from "../components/cgpa/SemesterCard";
import SemesterSkeleton from "../components/ui/SemesterSkeleton";
import { getSemesters } from "../queries/semesterQueries";
import { calculateSemesterStats } from "../services/academic";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../queries/userQueries";
import {
  deleteSemester,
  refreshAcademicData,
  enqueueAcademicMutation,
} from "../services/academic";
import DeleteModal from "../components/admin/DeleteModal";

export default function Semester() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const levelNumber =
    Number(new URLSearchParams(location.search).get("level")) || null;

  const [message, setMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!levelNumber) navigate("/levels");
  }, [levelNumber, navigate]);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });

  const userId = currentUser?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["semesters", levelNumber, userId],

    // Allow the local cache fallback to execute offline.
    networkMode: "always",

    queryFn: async () => {
      if (!navigator.onLine) {
        const cachedLevels = queryClient.getQueryData([
          "levels",
          userId,
        ]);

        const cachedLevel = cachedLevels?.levels?.find(
          (item) => item.level === levelNumber
        );

        if (!cachedLevel) {
          throw new Error("Level is not available offline.");
        }

        return {
          level: cachedLevel,
          semesters: cachedLevel.semesters || [],
        };
      }

      return getSemesters(levelNumber);
    },

    enabled: levelNumber !== null && Boolean(userId),
    staleTime: 10 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
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
    if (isAdding || !level) return;

    setIsAdding(true);
    setMessage("");

    const lastSemester = semesters.at(-1);

    const lastStats = lastSemester
      ? semesterStats[lastSemester.id]
      : null;

    if (lastSemester && lastStats?.units === 0) {
      setMessage("Calculate GPA for the last semester first");
      setIsAdding(false);
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const nextSemester = lastSemester
      ? lastSemester.semester + 1
      : 1;

    const semesterId = crypto.randomUUID();

    const semesterPayload = {
      id: semesterId,
      level_id: level.id,
      semester: nextSemester,
      gpa: null,
      total_units: 0,
    };

    try {
      if (!navigator.onLine) {
        await enqueueAcademicMutation(userId, {
          type: "semester.create",
          semesterId,
          levelId: level.id,
          payload: semesterPayload,
        });

        const localSemester = {
          ...semesterPayload,
          courses: [],
          _syncStatus: "pending",
        };

        // Update the current semester query cache.
        queryClient.setQueryData(
          ["semesters", levelNumber, userId],
          (old) => ({
            ...(old || {}),
            level: old?.level || level,
            semesters: [
              ...(old?.semesters || semesters),
              localSemester,
            ],
          })
        );

        // Also update the nested levels cache so the
        // semester remains available after offline navigation.
        queryClient.setQueryData(
          ["levels", userId],
          (old) => {
            if (!old?.levels) return old;

            return {
              ...old,
              levels: old.levels.map((item) =>
                item.id === level.id
                  ? {
                      ...item,
                      semesters: [
                        ...(item.semesters || []),
                        localSemester,
                      ],
                    }
                  : item
              ),
            };
          }
        );

        setMessage(
          `Semester ${nextSemester} saved offline. Waiting to sync.`
        );

        return;
      }

      const { error } = await supabase
        .from("semesters")
        .insert(semesterPayload);

      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: ["semesters", levelNumber, userId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["levels", userId],
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
      ...semesters.map((semester) => semester.semester)
    );

    if (selectedSemester.semester !== highestSemester) {
      toast.error(
        `Only Semester ${highestSemester} can be deleted.`
      );
      return;
    }

    try {
      setIsDeleting(true);

      // Handle deletion while offline.
      if (!navigator.onLine) {
        await enqueueAcademicMutation(userId, {
          type: "semester.delete",
          semesterId: selectedSemester.id,
        });

        // Remove the semester from the current semester cache.
        queryClient.setQueryData(
          ["semesters", levelNumber, userId],
          (old) => {
            if (!old) return old;

            return {
              ...old,
              semesters: (old.semesters || []).filter(
                (semester) => semester.id !== selectedSemester.id
              ),
            };
          }
        );

        // Remove it from the nested levels cache as well.
        queryClient.setQueryData(
          ["levels", userId],
          (old) => {
            if (!old?.levels) return old;

            return {
              ...old,
              levels: old.levels.map((item) =>
                item.id === level.id
                  ? {
                      ...item,
                      semesters: (item.semesters || []).filter(
                        (semester) =>
                          semester.id !== selectedSemester.id
                      ),
                    }
                  : item
              ),
            };
          }
        );

        // Remove cached courses belonging to this semester.
        queryClient.removeQueries({
          queryKey: ["courses", selectedSemester.id, userId],
        });

        toast.success("Semester deleted offline. Waiting to sync.");

        setShowDeleteModal(false);
        setSelectedSemester(null);
        return;
      }

      // Existing online deletion flow.
      await deleteSemester(selectedSemester.id);

      await refreshAcademicData({
        queryClient,
        level: levelNumber,
      });

      toast.success("Semester deleted successfully");

      setShowDeleteModal(false);
      setSelectedSemester(null);
    } catch {
      toast.error("Failed to delete semester");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="min-h-screen p-8
      bg-linear-to-br
      from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
      dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]"
    >
      {/* Header */}
      <div className="fixed top-6 left-4 flex items-center gap-3 bg-white/20 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-3xl z-50">
        <button onClick={() => navigate("/levels")}>
          <FaArrowLeft className="text-white hover:scale-110 transition-transform duration-300 ease-out hover:translate-x-0.5 cursor-pointer" />
        </button>

        <h1 className="text-white font-bold">
          {level
            ? `${level.level} Level Semesters`
            : "___ Level Semesters"}
        </h1>
      </div>

      {/* Semesters Grid */}
      {!currentUser || isLoading ? (
        <SemesterSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-20">
        <button
          type="button"
          onClick={() => navigate(`/pdf-extract?level=${levelNumber}`)}
          className="flex h-40 flex-col items-center justify-center gap-2 rounded-3xl border border-white/50 bg-white/20 p-6 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white/30 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 cursor-pointer"
        >
          <span className="text-3xl">📄</span>
          <span className="font-bold">Upload Result</span>
          <span className="text-center text-xs text-white/80">
            Import a downloaded result PDF
          </span>
        </button>

          {semesters.map((sem) => {
            const stats = semesterStats[sem.id];

            const highestSemester =
              semesters.length > 0
                ? Math.max(
                    ...semesters.map((item) => item.semester)
                  )
                : null;

            return (
              <SemesterCard
                key={sem.id}
                name={`${sem.semester}${["th", "st", "nd", "rd"][sem.semester] || "th"} Semester`}
                gpa={stats?.gpa?.toFixed(2) || "0.00"}
                onClick={() =>
                  navigate(
                    `/courses?level=${level.level}&semester=${sem.semester}&semesterId=${sem.id}`
                  )
                }
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
                ${
                  isAdding
                    ? "cursor-not-allowed text-gray-500 border-gray-200 dark:border-gray-800"
                    : "hover:border-white/80"
                }
              `}
            >
              + Add Semester
            </div>
          )}
        </div>
      )}

      {message && (
        <p className="text-center text-white mt-4">
          {message}
        </p>
      )}

      <DeleteModal
        open={showDeleteModal}
        loading={isDeleting}
        title="Delete Semester"
        description="Are you sure you want to delete"
        warning="Deleting this semester will also delete all courses inside it."
        itemName={`${
          selectedSemester?.semester === 1
            ? "First"
            : selectedSemester?.semester === 2
              ? "Second"
              : "Third"
        } Semester `}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSemester}
      />
    </div>
  );
}