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
import Placeholder from "./pages/Placeholder";
import CreateBlogPage from "./pages/CreateBlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import SifremiUnuttum from "./pages/SifremiUnuttum";
import SifreSifirla from "./pages/SifreSifirla";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./components/ThemeProvider";
import Magaza from "./pages/Magaza";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/bloglar" element={<Bloglar />} />
                <Route path="/bloglar/:id" element={<BlogPostPage />} />
                <Route path="/kullanici/:userId" element={<UserProfilePage />} />
                <Route path="/duyurular" element={<Placeholder title="Duyurular" />} />
                <Route path="/hakkimizda" element={<Placeholder title="Hakkımızda" />} />
                <Route path="/gizlilik-politikasi" element={<Placeholder title="Gizlilik Politikası" />} />
                <Route path="/kullanim-kosullari" element={<Placeholder title="Kullanım Koşulları" />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/blog-olustur" element={<CreateBlogPage />} />
                  <Route path="/profil" element={<ProfilePage />} />
                  <Route path="/magaza" element={<Magaza />} />
                </Route>
              </Route>
              
              {/* Auth and other pages without the main layout */}
              <Route path="/kaydol" element={<Kaydol />} />
              <Route path="/giris" element={<Giris />} />
              <Route path="/sifremi-unuttum" element={<SifremiUnuttum />} />
              <Route path="/sifre-sifirla" element={<SifreSifirla />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);