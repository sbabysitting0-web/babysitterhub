import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("parent" | "babysitter" | "admin")[];
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to={redirectTo} replace />;

  if (
    allowedRoles &&
    role &&
    !allowedRoles.includes(role as "parent" | "babysitter" | "admin")
  ) {
    // Redirect to appropriate dashboard
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "babysitter")
      return <Navigate to="/babysitter/dashboard" replace />;
    return <Navigate to="/parent/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
