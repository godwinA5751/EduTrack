import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const AddLevelButton = ({ levels, setLevels, userId }) => {
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPrompt, setShowPrompt] = useState(false);
  const [graduatePrompt, setGraduatePrompt] = useState(false);
  const [isGraduated, setIsGraduated] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchGraduationStatus = async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("graduated")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      if (profile?.graduated) {
        setIsGraduated(true);
      }
    };

    if (userId) {
      fetchGraduationStatus();
    }
  }, [userId]);

  const showTempMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 2500);
  };

  const createLevel = async (levelValue) => {
    if (isAdding) return;
    setIsAdding(true);
    setShowPrompt(false);

    // 🚀 Optimistic UI (instant)
    const optimisticLevel = {
      id: crypto.randomUUID(),
      level: levelValue,
      cgpa: 0,
      optimistic: true,
    };

    setLevels((prev) => [...prev, optimisticLevel]);

    try {
      const { data: realLevel, error } = await supabase
        .from("levels")
        .insert({
          user_id: userId,
          level: levelValue,
          cgpa: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // 🔁 Replace optimistic level with real one
      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === optimisticLevel.id ? realLevel : lvl))
      );

      // 🧠 Background update (non-blocking)
      supabase
        .from("profiles")
        .update({ current_level: levelValue })
        .eq("id", userId);

      showTempMessage(`Level ${levelValue} added successfully!`);
    } catch (err) {
      console.error(err);

      // ❌ Rollback optimistic update
      setLevels((prev) =>
        prev.filter((lvl) => lvl.id !== optimisticLevel.id)
      );

      showTempMessage("Failed to add level", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const addLevel = () => {
    if (isGraduated) {
      showTempMessage("You have already graduated 🎓", "error");
      return;
    }
    
    if (levels.length === 0) {
      setShowPrompt(true);
      return;
    }

    const lastLevel = levels[levels.length - 1];

    if (lastLevel.cgpa === 0) {
      showTempMessage(
        `You must calculate CGPA for ${lastLevel.level} Level first.`,
        "error"
      );
      return;
    }

    // 🎯 From 300 and above → ALWAYS ask
    if (lastLevel.level >= 300) {
      setGraduatePrompt(true);
      return;
    }

    // Normal flow (100 → 200 → 300)
    createLevel(lastLevel.level + 100);
  };

  return (
    <div>
      {/* Message */}
      {message.text && (
        <div
          className={`text-center py-4 font-semibold text-sm ${message.type === "error" ? "text-red-500" : "text-green-400"
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
              {/* ✅ YES → graduate */}
              <button
                onClick={async () => {
                  const nextLevel = levels[levels.length - 1].level + 100;

                  await createLevel(nextLevel);

                  const { error } = await supabase
                    .from("profiles")
                    .update({ graduated: true })
                    .eq("id", userId);

                  if (!error) {
                    setIsGraduated(true);
                  }

                  setGraduatePrompt(false);
                }}
                className="cursor-pointer px-6 py-2 rounded-xl bg-[#199FB1] text-white font-semibold"
              >
                Yes
              </button>

              {/* ❌ NO → continue journey */}
              <button
                onClick={() => {
                  const nextLevel = levels[levels.length - 1].level + 100;



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
      {isGraduated ? (
        <div className="w-full text-center py-6 font-bold text-green-500 text-lg">
          🎓 Graduated
        </div>
      ) : (
        <button
          disabled={isAdding}
          onClick={addLevel}
          className={`w-full flex items-center justify-center rounded-3xl border-2 dark:border-gray-700 border-dashed h-50 font-semibold transition
          ${isAdding
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