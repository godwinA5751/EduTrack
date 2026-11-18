import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../queries/userQueries";
import { useIsRestoring, useQuery } from "@tanstack/react-query";
import AppLoader from "../ui/AppLoader";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isRestoring = useIsRestoring();

  const {
    data: profile,
    isPending,
    isPaused,
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  if (isRestoring) {
    return <AppLoader />;
  }

  if (isPending && !profile) {
    return (
      <AppLoader
        message={
          isPaused
            ? "You're offline. Connect to the internet to sign in or load your academic data for the first time."
            : "Loading EduTrack..."
        }
      />
    );
  }

  if (!profile) return <Navigate to="/login" replace />;
  

  if (
    profile.must_change_password &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}