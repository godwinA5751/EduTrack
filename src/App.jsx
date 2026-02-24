import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useSystemTheme } from "./hooks/useSystemTheme";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import DashBoard from "./pages/DashBoard";
import Levels from "./pages/Levels";
import Profile from "./pages/Profile";
import Semester from "./pages/Semester";
import Course from "./pages/Course";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ChangePassword from "./pages/ChangePassword";

function App() {
  const isDark = useSystemTheme();

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* 🔐 Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashBoard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/levels"
        element={
          <ProtectedRoute>
            <Levels />
          </ProtectedRoute>
        }
      />

      <Route
        path="/semester"
        element={
          <ProtectedRoute>
            <Semester />
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Course />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
