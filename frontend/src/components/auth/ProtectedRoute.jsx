import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../queries/userQueries";
import { useIsRestoring, useQuery } from "@tanstack/react-query";

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading EduTrack...
      </div>
    );
  }

  if (isPending && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {isPaused ? (
          <p>
            You're offline. Connect to the internet to sign in or load your
            academic data for the first time.
          </p>
        ) : (
          <p>Loading...</p>
        )}
      </div>
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