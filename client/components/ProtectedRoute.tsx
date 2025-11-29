import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-white text-center p-12">Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return <Outlet />;
}