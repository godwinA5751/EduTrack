import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirm) {
      return setMessage({ text: "Please fill all fields", type: "error" });
    }

    if (password !== confirm) {
      return setMessage({ text: "Passwords do not match", type: "error" });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/;
    if (!passwordRegex.test(password)) {
      return setMessage({
        text: "Password must be 6-12 characters and include at least one letter and one number",
        type: "error",
      });
    }

    try {
      // 1️⃣ Update password
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage({
        text: "Password updated. Please login again.",
        type: "success",
      });

      // 2️⃣ Small delay so user sees message
      setTimeout(async () => {
        // 3️⃣ Sign out user
        await supabase.auth.signOut();

        // 4️⃣ Clear any local data
        localStorage.clear();

        // 5️⃣ Redirect to login
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setMessage({
        text: err.message || "Failed to update password",
        type: "error",
      });
    }
  };

  return (
    <div className="
        overflow-hidden min-h-screen p-8 
        bg-gradient-to-br 
        from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
        dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22]"
      >
      <Header title="Change Password" subtitle="Update your account password" />
      <form
        onSubmit={handleSubmit}
        className="max-w-md mt-35 mx-auto bg-white/10 dark:bg-white/5 p-8 rounded-3xl flex flex-col gap-4"
      >

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-white/5 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/70"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-3 rounded-xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-white/5 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/70"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {message.text && (
          <p
            className={`text-center text-sm ${message.type === "error"
              ? "text-red-500"
              : "text-green-400"
              }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          className="bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-white py-3 rounded-xl font-semibold cursor-pointer"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}