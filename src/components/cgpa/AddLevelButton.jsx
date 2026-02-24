import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const AddLevelButton = ({ levels, setLevels, userId }) => {
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

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
    // 🆕 First-time user
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

    createLevel(Number(lastLevel.level) + 100);
  };

  return (
    <div>
      {/* Message */}
      {message.text && (
        <div
          className={`text-center py-4 font-semibold text-sm ${
            message.type === "error" ? "text-red-500" : "text-green-400"
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

      {/* Add Level Button */}
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
    </div>
  );
};

export default AddLevelButton;