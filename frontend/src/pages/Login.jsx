import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { FaEye, FaEyeSlash, FaWhatsapp } from "react-icons/fa";
import {
  supabase,
  setRememberMePreference,
} from "../lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";

const matricToEmail = (matricNo) =>
  `${matricNo.replace(/\W+/g, "").toLowerCase()}@edutrack.app`;

export default function Login() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [form, setForm] = useState({
    matricNo: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!form.matricNo || !form.password) {
      setMessage({ text: "Please fill all fields", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 2000);
      return;
    }

    try {
      // 1️⃣ Normalize matric number
      const matricNo = form.matricNo.trim().toUpperCase();
      const email = matricToEmail(matricNo);
      setLoading(true);
      setRememberMePreference(rememberMe);

      // 2️⃣ Login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (error) {
        setMessage({
          text:
            error.code === "invalid_credentials" ||
            error.message === "Invalid login credentials"
              ? "Incorrect matric number or password."
              : "Unable to log in. Please try again.",
          type: "error",
        });
        return;
      }

      const userId = data.user.id;

      // 3️⃣ Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", userId)
        .single();
      
      if (profileError || !profile) {
        await supabase.auth.signOut();

        setMessage({
          text: "We couldn't load your account profile. Please try again.",
          type: "error",
        });
        return;
      }
      
      await queryClient.invalidateQueries({
        queryKey: ["current-user"],
      });
      
      navigate(
        profile.must_change_password
          ? "/change-password"
          : "/dashboard"
      );
    } catch {
      setMessage({
        text: "Unable to connect. Please check your internet connection and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const whatsappLink = () => {
    const matricNo = form.matricNo.trim().toUpperCase();
    if (!matricNo) {
      setMessage({
        text: "Please enter your matric number first.",
        type: "error",
      });
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
      return;
    }
    const message = encodeURIComponent(`
      Hello EduTrack Admin,
      I forgot my EduTrack password.
      Matric Number: ${matricNo}
      Please help me reset my password.
      Thank you.
    `);
    window.open(
      `https://wa.me/+2348130575100?text=${message}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
  bg-linear-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] px-4">

      <form
        onSubmit={handleSubmit}
        className="bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-3xl p-10 max-w-md w-full shadow-lg flex flex-col gap-6"
      >
        <h2 className="text-3xl font-bold text-white text-center">Login</h2>

        <input
          type="text"
          name="matricNo"
          placeholder="Matric Number"
          value={form.matricNo}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-white/5 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-white/5 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/70"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="
              appearance-none w-4.5 h-4.5 rounded-full
              border-2 border-gray-500 dark:border-white/70
              bg-transparent
              checked:bg-[#0D5C75] checked:border-[#0D5C75]
              checked:after:content-['✓']
              checked:after:flex checked:after:items-center
              checked:after:justify-center checked:after:text-white
              checked:after:text-xs
              cursor-pointer transition-all
            "
          />
          <span className="text-gray-700 dark:text-white/90">
            Remember me
          </span>
        </label>

        <Button
          disabled={loading}
          loading={loading}
          type="submit"
          className={`w-full bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-2xl transition-all`}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
        <p
          className="
          flex items-center 
          justify-center 
          gap-4
          w-full 
          bg-white/30 dark:bg-white/10 
          hover:bg-white/50 dark:hover:bg-white/20 
          text-white 
          font-semibold 
          px-6 
          py-3 
          rounded-2xl 
          transition-all
          cursor-pointer
          "
          onClick={whatsappLink}
        >
          <FaWhatsapp size={30} />
          <span className="text-sm">
            Forgot your password? Message EduTrack Admin on WhatsApp
          </span>
        </p>
        {message.text && (
          <div
            className={`text-center text-sm font-semibold transition-all ${message.type === "error" ? "dark:text-red-400 text-red-500" : "text-[lightgreen]"
              }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-center text-white/80 mt-2">
          Don’t have an account?{" "}
          <span
            className="text-white font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}