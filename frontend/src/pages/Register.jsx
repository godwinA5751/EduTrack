import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const matricToEmail = (matricNo) =>
  `${matricNo.replace(/\W+/g, "").toLowerCase()}@edutrack.app`;

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    matricNo: "",
    password: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "" });
  };

  // Handle form submit
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    const fullName = form.fullName.trim();
    const matricNo = form.matricNo.trim().toUpperCase();

    if (!fullName || !matricNo || !form.password) {
      setMessage({ text: "Please fill all fields", type: "error" });
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/;

    if (!passwordRegex.test(form.password)) {
      setMessage({
        text: "Password must be 6–12 characters with letters & numbers",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const email = matricToEmail(matricNo);

      // Create Auth user and pass profile information as metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: fullName,
            matric_no: matricNo,
          },
        },
      });

      if (error) {
        setMessage({
          text: error.message,
          type: "error",
        });
        return;
      }

      if (!data.user) {
        setMessage({
          text: "Registration could not be completed. Please try again.",
          type: "error",
        });
        return;
      }

      // Sign out after successful registration
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setMessage({
          text: "Registration succeeded, but automatic sign-out failed. Please log out before continuing.",
          type: "error",
        });
        return;
      }

      setMessage({
        text: "Registration successful 🎉 Redirecting...",
        type: "success",
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch {
      setMessage({
        text: "Unable to connect. Please check your internet connection and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/;

  return (
    <div className="min-h-screen flex items-center justify-center 
  bg-linear-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-3xl p-10 max-w-md w-full shadow-lg flex flex-col gap-6"
      >
        <h2 className="text-3xl font-bold text-white text-center">Register</h2>

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-white/30 dark:border-white/10 bg-white/10 dark:bg-white/5 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
        />

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
        {form.password && !passwordRegex.test(form.password) && (
          <span className="text-white/70 text-sm">
            Password must be 6-12 characters and contain both letters and numbers
          </span>
        )}


        <Button
          type="submit"
          className={`w-full bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-2xl transition-all`}
          disabled={loading}
          loading={loading}
        >
          {loading ? "Registering..." : "Register"}
        </Button>
        {message.text && (
          <div
            className={`text-center text-sm font-semibold transition-all ${message.type === "error" ? "dark:text-red-400 text-red-500" : "text-[lightgreen]"
              }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-center text-white/80 mt-2">
          Already have an account?{" "}
          <span
            className="text-white font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}
