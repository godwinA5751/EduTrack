import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";

const matricToEmail = (matricNo) =>
  `${matricNo.replace(/\W+/g, "").toLowerCase()}@edutrack.app`;

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [form, setForm] = useState({
    matricNo: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

      // 2️⃣ Login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (error) {
        setMessage({ text: "Invalid matric number or password", type: "error" });
        return;
      }

      const userId = data.user.id;

      // 3️⃣ Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        setMessage({ text: "Profile not found", type: "error" });
        return;
      }

      // ✅ Optional (temporary, until dashboard fully uses Supabase)
      localStorage.setItem("currentUser", JSON.stringify(profile));

      navigate("/dashboard");
    } catch (err) {
      setMessage({ text: `${err}Something went wrong`, type: "error" });
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#A5D1E1] via-[#199FB1] to-[#0D5C75] px-4">

      <form
        onSubmit={handleSubmit}
        className="bg-white/20 backdrop-blur-md rounded-3xl p-10 max-w-md w-full shadow-lg flex flex-col gap-6"
      >
        <h2 className="text-3xl font-bold text-white text-center">Login</h2>

        <input
          type="text"
          name="matricNo"
          placeholder="Matric Number"
          value={form.matricNo}
          onChange={handleChange}
          className="w-full p-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-white/30 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/70"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <Button
          type="submit"
          className="w-full bg-white/30 hover:bg-white/50 text-white font-semibold px-6 py-3 rounded-2xl transition-all"
        >
          Login
        </Button>
        {message.text && (
          <div
            className={`text-center text-sm font-semibold transition-all ${message.type === "error" ? "text-[red]/50" : "text-[lightgreen]"
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