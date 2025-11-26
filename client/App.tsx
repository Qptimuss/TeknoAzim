import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Bloglar from "./pages/Bloglar";
import Kaydol from "./pages/Kaydol";
import Giris from "./pages/Giris";
import Layout from "./components/Layout";
import Hakkimizda from "./pages/Hakkimizda";
import Duyurular from "./pages/Duyurular";
import CreateBlogPage from "./pages/CreateBlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import SifremiUnuttum from "./pages/SifremiUnuttum";
import SifreSifirla from "./pages/SifreSifirla";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./components/ThemeProvider";
import Magaza from "./pages/Magaza";
import EditBlogPage from "./pages/EditBlogPage";
import CreateAnnouncementPage from "./pages/CreateAnnouncementPage";
import EditAnnouncementPage from "./pages/EditAnnouncementPage"; // Import new page
import { executeAdminGrant } from "./lib/admin-grant";

const queryClient = new QueryClient();

// New component to handle post-auth logic
const PostAuthInitializer = () => {
  const { user, updateUser, loading } = useAuth();

  // Run the admin grant logic once after user data is loaded
  if (!loading) {
    executeAdminGrant(user, updateUser);
  }

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <Toaster />
        <Sonner />
        <AuthProvider>
          <PostAuthInitializer />
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/bloglar" element={<Bloglar />} />
                <Route path="/bloglar/:id" element={<BlogPostPage />} />
                <Route path="/kullanici/:userId" element={<UserProfilePage />} />
                <Route path="/duyurular" element={<Duyurular />} />
                <Route path="/hakkimizda" element={<Hakkimizda />} />
                <Route path="/gizlilik-politikasi" element={<Hakkimizda />} />
                <Route path="/kullanim-kosullari" element={<Hakkimizda />} />
                <Route path="/magaza" element={<Magaza />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/blog-olustur" element={<CreateBlogPage />} />
                  <Route path="/profil" element={<ProfilePage />} />
                  <Route path="/bloglar/:id/duzenle" element={<EditBlogPage />} />
                  <Route path="/duyuru-olustur" element={<CreateAnnouncementPage />} />
                  <Route path="/duyuru/:id/duzenle" element={<EditAnnouncementPage />} /> {/* New route */}
                </Route>
              </Route>

              <Route path="/kaydol" element={<Kaydol />} />
              <Route path="/giris" element={<Giris />} />
              <Route path="/sifremi-unuttum" element={<SifremiUnuttum />} />
              <Route path="/sifre-sifirla" element={<SifreSifirla />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);