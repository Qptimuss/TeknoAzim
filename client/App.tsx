import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";
import Footer from "./components/Footer"; // Footer bileşenini import et

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen"> {/* Eklenen div */}
          <div className="flex-grow"> {/* Eklenen div */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/bloglar" element={<Placeholder title="Bloglar" />} />
              <Route path="/duyurular" element={<Placeholder title="Duyurular" />} />
              <Route path="/hakkimizda" element={<Placeholder title="Hakkımızda" />} />
              <Route path="/kaydol" element={<Placeholder title="Kaydol" />} />
              <Route path="/giris" element={<Placeholder title="Giriş Yap" />} />
              <Route path="/gizlilik-politikasi" element={<Placeholder title="Gizlilik Politikası" />} />
              <Route path="/kullanim-kosullari" element={<Placeholder title="Kullanım Koşulları" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer /> {/* Footer'ı buraya ekledik */}
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);