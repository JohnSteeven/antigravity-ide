import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "./LoadingScreen";

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default GuestRoute;
