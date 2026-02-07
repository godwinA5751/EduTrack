import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/layout/Header";
import ProfileSkeleton from "../components/ui/ProfileSkeleton";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [academic, setAcademic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndAcademics = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        const userId = session.user.id;

        const [profileRes, levelsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, matric_no, registered_level, current_level")
            .eq("id", userId)
            .single(),
          supabase
            .from("levels")
            .select(`
              id,
              level,
              semesters (
                id,
                semester,
                courses (
                  unit,
                  point
                )
              )
            `)
            .eq("user_id", userId)
        ]);

        if (profileRes.error) throw profileRes.error;
        if (levelsRes.error) throw levelsRes.error;

        setProfile(profileRes.data);
        setAcademic(levelsRes.data || []);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndAcademics();
  }, [navigate]);

  const stats = useMemo(() => {
    let totalLevels = academic.length;
    let totalSemesters = 0;
    let totalUnits = 0;
    let totalPoints = 0;

    academic.forEach((lvl) => {
      lvl.semesters?.forEach((sem) => {
        totalSemesters += 1;
        sem.courses?.forEach((course) => {
          const unit = course.unit || 0;
          const point = course.point || 0;
          totalUnits += unit;
          totalPoints += unit * point;
        });
      });
    });

    const cumulativeCGPA = totalUnits ? totalPoints / totalUnits : 0;

    return {
      levels: totalLevels,
      semesters: totalSemesters,
      units: totalUnits,
      points: totalPoints,
      cgpa: cumulativeCGPA,
    };
  }, [academic]);

  if (loading)  return <ProfileSkeleton />;

  if (!profile) return null;

  const initial = profile.full_name?.charAt(0) || "?";

  const degreeClass =
    stats.cgpa < 1
      ? "Fail"
      : stats.cgpa < 1.5
      ? "Pass"
      : stats.cgpa < 2.5
      ? "Third Class"
      : stats.cgpa < 3.5
      ? "Second Class Lower"
      : stats.cgpa < 4.5
      ? "Second Class Upper"
      : stats.cgpa <= 5
      ? "First Class"
      : "Nil";

  return (
    <div className="bg-gradient-to-br from-[#A5D1E1] via-[#199FB1] to-[#0D5C75] min-h-screen overflow-hidden">
      <Header title="Profile" subtitle="Your academic summary" />

      <div className="px-6 h-[calc(100vh-70px)] overflow-y-auto scrollbar-hide scroll-smooth">
        <div className="max-w-3xl mx-auto mt-50 bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-lg flex flex-col gap-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#A7EBF2]/50 flex items-center justify-center text-3xl font-bold text-white">
              {initial}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {profile.full_name}
              </h2>
              <p className="text-white/80">{profile.matric_no}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat label="Current Level" value={profile.current_level} />
            <Stat label="Cumulative GPA" value={stats.cgpa.toFixed(2)} />
            <Stat label="Levels" value={stats.levels} />
            <Stat label="Semesters" value={stats.semesters} />
            <Stat label="Total Units" value={stats.units} />
            <Stat label="Total Points" value={stats.points} />
            <Stat label="Class" value={degreeClass} />
            <Stat label="Registered Level" value={profile.registered_level} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-white/70 text-sm">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}