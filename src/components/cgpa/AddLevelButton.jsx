import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const AddLevelButton = ({ levels, setLevels, userId }) => {
  const [message, setMessage] = useState({ text: "", type: "" });

  const addLevel = async () => {
    // 🔒 Prevent adding new level if last CGPA is not calculated
    if (levels.length > 0) {
      const lastLevel = levels[levels.length - 1];
      if (lastLevel.cgpa === 0) {
        setMessage({
          text: `You must calculate CGPA for ${lastLevel.level} Level before adding a new level.`,
          type: "error",
        });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        return;
      }
    }

    // Determine next level
    const nextLevel =
      levels.length === 0
        ? 100
        : Number(levels[levels.length - 1].level) + 100;

    try {
      // 1️⃣ Insert new level
      const { data: newLevel, error } = await supabase
        .from("levels")
        .insert({
          user_id: userId,
          level: nextLevel,
          cgpa: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // ✅ 2️⃣ UPDATE profile.currentLevel (NEW)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ current_level: nextLevel })
        .eq("id", userId);

      if (profileError) throw profileError;

      // 3️⃣ Update React state
      setLevels([...levels, newLevel]);

      setMessage({
        text: `Level ${nextLevel} added successfully!`,
        type: "success",
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to add level", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  return (
    <div>
      {message.text && (
        <div
          className={`text-center py-4 font-semibold text-sm ${
            message.type === "error" ? "text-red-500" : "text-green-400"
          }`}
        >
          {message.text}
        </div>
      )}
      <button
        className="w-full flex items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 h-50 cursor-pointer hover:bg-gray-50 transition text-gray-400 font-semibold"
        onClick={addLevel}
      >
        Add Level
      </button>
    </div>
  );
};

export default AddLevelButton;
