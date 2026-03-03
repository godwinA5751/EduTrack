import { Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { useSystemTheme } from "./hooks/useSystemTheme";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const DashBoard = lazy(() => import("./pages/DashBoard"));
const Levels = lazy(() => import("./pages/Levels"));
const Profile = lazy(() => import("./pages/Profile"));
const Semester = lazy(() => import("./pages/Semester"));
const Course = lazy(() => import("./pages/Course"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));

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
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
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
    </Suspense>
  );
}

export default App;