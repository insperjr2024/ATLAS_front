import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function PrivateRoute() {
  const { token, carregando } = useAuth();

  if (carregando) return <div>Carregando...</div>;
  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
}