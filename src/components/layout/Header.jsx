import Sidebar from "./SideBar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function Header({ title, subtitle }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const userId = session.user.id;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        navigate("/login");
        return;
      }

      setUser(profile);
    };

    fetchUser();
  }, [navigate]);

  if (!user) return null;

  const initial = user.full_name?.charAt(0) || "?";

  return (
    <header className="fixed top-8 left-6 right-6 z-50 rounded-3xl 
  bg-gradient-to-br 
  from-[#A5D1E1] via-[#199FB1] to-[#0D5C75]
  dark:from-[#0B1F2A] dark:via-[#0F3A47] dark:to-[#021A22] p-6 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div>
          <h1 className="text-white text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
        </div>

        {/* Right */}
        <div className="text-right">
          <Sidebar icon={initial} name={user.full_name} />
        </div>
      </div>
    </header>
  );
}
