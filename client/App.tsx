import "./global.css";

import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
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
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./components/ThemeProvider";
import Magaza from "./pages/Magaza";
import EditBlogPage from "./pages/EditBlogPage";
import CreateAnnouncementPage from "./pages/CreateAnnouncementPage";
import EditAnnouncementPage from "./pages/EditAnnouncementPage";
import DailyRewardNotifier from "./components/DailyRewardNotifier";
import React from "react"; // useRef için React import edildi

// Global QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: (failureCount, error: any) => {
        const isAuthError = 
          error?.message?.includes("JWT") ||
          error?.message?.includes("Unauthorized") ||
          error?.message?.includes("session") ||
          error?.status === 401 ||
          (error?.response?.status === 401);

        if (isAuthError) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Global ref to store the auth error handler from AuthContext
export const authErrorHandlerRef = React.createRef<() => Promise<void>>();

// Configure QueryCache onError globally
queryClient.setQueryCache(new QueryCache({
  onError: async (error: any) => {
    const isAuthError = 
      error?.message?.includes("JWT") ||
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("session") ||
      error?.status === 401 ||
      (error?.response?.status === 401);

    if (isAuthError && authErrorHandlerRef.current) {
      await authErrorHandlerRef.current();
    }
  },
}));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <Sonner />
        <AuthProvider> {/* AuthProvider artık QueryClientProvider içinde */}
          <DailyRewardNotifier /> 
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
                  <Route path="/duyuru/:id/duzenle" element={<EditAnnouncementPage />} />
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