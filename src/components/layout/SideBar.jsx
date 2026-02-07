import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "../../asset/logo.PNG";
import {
  FaHome,
  FaLayerGroup,
  FaUser,
  FaTimes,
} from "react-icons/fa";
import { supabase } from "../../lib/supabaseClient";

export default function Sidebar({ icon, name }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // 🔥 Auto-close sidebar on route change
  useEffect(() => {
    setTimeout(() => setOpen(false), 0);
  }, [location.pathname]);


  const menuItems = [
    { name: "Dashboard", icon: <FaHome />, href: "/dashboard" },
    { name: "Levels", icon: <FaLayerGroup />, href: "/levels" },
    { name: "Profile", icon: <FaUser />, href: "/profile" },
    {
      name: "Logout",
      icon: <FaTimes />,
      href: "/",
      action: async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
      },

    },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="ml-12 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold cursor-pointer"
      >
        {open ? <FaTimes /> : icon}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-[calc(100%-32px)] w-64
          bg-[#A5D1E1]/30 backdrop-blur-md
          shadow-lg rounded-r-3xl p-6
          flex flex-col justify-between
          transform transition-all duration-300 ease-in-out
          ${open ? "translate-x-0 translate-y-8" : "-translate-x-full"}
          z-40
        `}
      >
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2 justify-end">
          <img src={Logo} alt="EduTrack Logo" className="w-8 h-8 py-1" />
          <h1 className="text-2xl font-bold text-white">EduTrack</h1>        
        </div>

        {/* Menu */}
        <nav className="flex-1">
          <ul className="flex flex-col gap-2 relative">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <li key={item.name} className="relative">
                  {/* Active indicator */}
                  {isActive && (
                    <span className="
                      absolute left-0 top-1/2 -translate-y-1/2
                      h-8 w-1 bg-white rounded-full
                      transition-all duration-300
                    " />
                  )}

                  <NavLink
                    to={item.href}
                    onClick={(e) => {
                      if (item.action) {
                        e.preventDefault(); // prevent default navigation
                        item.action();
                      }
                    }}
                    className={`
                      flex items-center gap-3 p-3 pl-6 rounded-xl
                      transition-all duration-300
                      ${isActive
                        ? "bg-white/30 text-white scale-[1.02] "
                        : "text-white/70 hover:bg-white/20 hover:text-white"
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer */}
        <div className="mt-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#A7EBF2]/50 flex items-center justify-center font-bold text-white">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-white/80">Student</p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
