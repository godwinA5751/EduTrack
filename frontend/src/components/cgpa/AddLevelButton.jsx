
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { enqueueAcademicMutation } from "../../services/academic";

const AddLevelButton = ({
  levels = [],
  userId,
  levelStats = {},
}) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPrompt, setShowPrompt] = useState(false);
  const [graduatePrompt, setGraduatePrompt] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["graduation-status", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("graduated")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const isGraduated = !!profile?.graduated;

  const showTempMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 2500);
  };

  const lastLevel = levels[levels.length - 1];
  const lastLevelStats = lastLevel ? levelStats[lastLevel.id] : null;
  const canShowGraduated = isGraduated && lastLevelStats?.gpa > 0;

  const updateGraduationStatus = async (graduated) => {
    const payload = { graduated };

    if (!navigator.onLine) {
      await enqueueAcademicMutation(userId, {
        type: "profile.update",
        profileId: userId,
        payload,
      });

      queryClient.setQueryData(
        ["graduation-status", userId],
        (old) => ({
          ...(old || {}),
          graduated,
        })
      );

      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);

    if (error) throw error;

    queryClient.setQueryData(
      ["graduation-status", userId],
      (old) => ({
        ...(old || {}),
        graduated,
      })
    );

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["graduation-status", userId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["profile", userId],
      }),
    ]);
  };

  const createLevel = async (levelValue) => {
    if (isAdding) return false;

    setIsAdding(true);
    setShowPrompt(false);

    const levelId = crypto.randomUUID();

    const levelPayload = {
      id: levelId,
      user_id: userId,
      level: levelValue,
      cgpa: 0,
    };

    const optimisticLevel = {
      ...levelPayload,
      semesters: [],
      optimistic: true,
    };

    const previousData = queryClient.getQueryData([
      "levels",
      userId,
    ]);

    const fallbackData = previousData ?? {
      levels,
      stats: levelStats,
      userId,
    };

    queryClient.setQueryData(
      ["levels", userId],
      (old) => ({
        ...(old ?? fallbackData),
        levels: [
          ...(old?.levels ?? fallbackData.levels),
          optimisticLevel,
        ],
      })
    );

    try {
      if (!navigator.onLine) {
        await enqueueAcademicMutation(userId, {
          type: "level.create",
          levelId,
          payload: levelPayload,
        });

        queryClient.setQueryData(
          ["levels", userId],
          (old) => ({
            ...(old ?? fallbackData),
            levels: (old?.levels ?? fallbackData.levels).map(
              (level) =>
                level.id === levelId
                  ? {
                      ...level,
                      optimistic: false,
                      _syncStatus: "pending",
                    }
                  : level
            ),
          })
        );

        showTempMessage(
          `Level ${levelValue} saved offline. Waiting to sync.`
        );

        return true;
      }

      const { data: realLevel, error } = await supabase
        .from("levels")
        .upsert(levelPayload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      queryClient.setQueryData(
        ["levels", userId],
        (old) => {
          const current = old ?? fallbackData;

          return {
            ...current,
            levels: current.levels.map((level) =>
              level.id === levelId
                ? {
                    ...realLevel,
                    semesters: [],
                  }
                : level
            ),
          };
        }
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["levels", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard-cgpa", userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["profile", userId],
        }),
      ]);

      showTempMessage(`Level ${levelValue} added successfully!`);

      return true;
    } catch {
      queryClient.setQueryData(
        ["levels", userId],
        previousData
      );

      showTempMessage("Failed to add level", "error");

      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const addLevel = () => {
    if (isGraduated) {
      showTempMessage("You have reached the final year 🎓", "error");
      return;
    }

    if (levels.length === 0) {
      setShowPrompt(true);
      return;
    }

    if (
      !lastLevelStats ||
      lastLevelStats.units === 0 ||
      lastLevelStats.gpa <= 0
    ) {
      showTempMessage(
        `Complete ${lastLevel.level} Level before adding another level.`,
        "error"
      );
      return;
    }

    if (lastLevel.level >= 300) {
      setGraduatePrompt(true);
      return;
    }

    createLevel(lastLevel.level + 100);
  };

  return (
    <div>
      {/* Message */}
      {message.text && (
        <div
          className={`text-center py-4 font-semibold text-sm ${
            message.type === "error"
              ? "text-red-500"
              : "text-green-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Direct Entry Prompt */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 w-[90%] max-w-sm text-center">
            <h2 className="font-bold text-lg mb-4 text-gray-700">
              Are you a Direct Entry student?
            </h2>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => createLevel(200)}
                className="cursor-pointer px-6 py-2 rounded-xl bg-[#199FB1] text-white font-semibold"
              >
                Yes
              </button>

              <button
                onClick={() => createLevel(100)}
                className="cursor-pointer px-6 py-2 rounded-xl bg-gray-200 font-semibold"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Graduate Prompt */}
      {graduatePrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 w-[90%] max-w-sm text-center">
            <h2 className="font-bold text-lg mb-4 text-gray-700">
              Is this your final year?
            </h2>

            <div className="flex gap-4 justify-center">
              <button
                disabled={isAdding}
                onClick={async () => {
                  const nextLevel =
                    levels[levels.length - 1].level + 100;

                  const created = await createLevel(nextLevel);

                  if (!created) return;

                  try {
                    await updateGraduationStatus(true);
                    showTempMessage(
                      "Final year added successfully!"
                    );
                    setGraduatePrompt(false);
                  } catch {
                    showTempMessage(
                      "Level added, but graduation status failed to update.",
                      "error"
                    );
                  }
                }}
                className="cursor-pointer px-6 py-2 rounded-xl bg-[#199FB1] text-white font-semibold"
              >
                Yes
              </button>

              <button
                disabled={isAdding}
                onClick={() => {
                  const nextLevel =
                    levels[levels.length - 1].level + 100;

                  createLevel(nextLevel);
                  setGraduatePrompt(false);
                }}
                className="cursor-pointer px-6 py-2 rounded-xl bg-gray-200 font-semibold"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Level Button */}
      {canShowGraduated ? (
        <div className="w-full flex flex-col items-center justify-center text-center py-0 gap-1">
          <span className="text-3xl">🎓</span>
          <span className="font-bold text-green-500 text-lg">
            Congratulations, you did it!
          </span>
          <span className="text-sm text-gray-400">
            Wishing you nothing but success ahead 🎉
          </span>
        </div>
      ) : (
        <button
          disabled={isAdding}
          onClick={addLevel}
          className={`w-full flex items-center justify-center rounded-3xl border-2 dark:border-gray-700 border-dashed h-50 font-semibold transition
          ${
            isAdding
              ? "cursor-not-allowed text-gray-500 border-gray-200 dark:border-gray-800"
              : "cursor-pointer text-gray-500 border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
          }
        `}
        >
          {isAdding ? "Adding..." : "Add Level"}
        </button>
      )}
    </div>
  );
};

export default AddLevelButton;
