import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Kullanıcı giriş yapmışsa, doğrudan profil sayfasına yönlendir
      navigate("/profil", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || user) {
    // Yüklenirken veya yönlendirilirken boş bir şey göster
    return <div className="min-h-screen bg-background" />;
  }

  // Kullanıcı giriş yapmamışsa, normal Index sayfasını göster
  return <Index />;
}