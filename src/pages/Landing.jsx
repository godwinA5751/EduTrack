import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center 
  bg-gradient-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] px-4">
      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-3xl p-12 max-w-2xl text-center shadow-lg flex flex-col gap-6">
        
        {/* Title */}
        <h1 className="text-5xl font-extrabold text-white">
          EduTrack
        </h1>

        {/* Description */}
        <p className="text-lg text-white/80">
          Track your semester GPAs, calculate level GPA, and view your cumulative academic progress in one clean dashboard. Simple, fast, and student-friendly.
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-4">
          <Button
            onClick={() => navigate("/register")}
            className="bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 text-white font-semibold px-6 py-2 rounded-2xl transition-all"
          >
            Register
          </Button>

          <Button
            onClick={() => navigate("/login")}
            className="bg-green-500 dark:bg-green-400 hover:bg-green-600 dark:hover:bg-green-500 text-white font-semibold px-6 py-2 rounded-2xl transition-all"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}
