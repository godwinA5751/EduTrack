import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../queries/userQueries";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const {
    data: profile,
    isLoading,
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (
    profile.must_change_password &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}