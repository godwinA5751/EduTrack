import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useQueryClient } from "@tanstack/react-query";

export default function ChangePassword() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
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
      // 1 Update password
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // 2 Refresh the auth session
      const { data: refreshed } = await supabase.auth.refreshSession();
      
      if (!refreshed.session) {
        throw new Error("Failed to refresh session");
      }
      
      // 3 Get the refreshed session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      // 4 Clear must_change_password flag
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          must_change_password: false,
        })
        .eq("id", session.user.id);
      
      if (profileError) throw profileError;

      // 5 Refresh cached current user
      await queryClient.invalidateQueries({
        queryKey: ["current-user"],
      });
      
      await queryClient.refetchQueries({
        queryKey: ["current-user"],
      });
      
      toast.success("Password updated successfully.");
      
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err) toast.error("Failed to update password");
    }
  };

  return (
    <div className="
        overflow-hidden min-h-screen p-8 
        bg-linear-to-br 
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
              ? "text-red-400"
              : "text-green-400"
              }`}
          >
            {message.text}
          </p>
        )}

        <button
          disabled={loading}
          type="submit"
          className="bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-white py-3 rounded-xl font-semibold cursor-pointer"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}