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
import Footer from "./components/Footer";
import Kaydol from "./pages/Kaydol";
import Giris from "./pages/Giris"; // Giris bileşenini import et

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/bloglar" element={<Placeholder title="Bloglar" />} />
              <Route path="/duyurular" element={<Placeholder title="Duyurular" />} />
              <Route path="/hakkimizda" element={<Placeholder title="Hakkımızda" />} />
              <Route path="/kaydol" element={<Kaydol />} />
              <Route path="/giris" element={<Giris />} /> {/* Giris route'u */}
              <Route path="/gizlilik-politikasi" element={<Placeholder title="Gizlilik Politikası" />} />
              <Route path="/kullanim-kosullari" element={<Placeholder title="Kullanım Koşulları" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);