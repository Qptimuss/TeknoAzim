import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SifreSifirla() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Supabase session is now active for password update
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Hata", { description: "Şifreler eşleşmiyor." });
      return;
    }
    if (password.length < 6) {
      toast.error("Hata", { description: "Şifre en az 6 karakter olmalıdır." });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      toast.error("Hata", { description: "Şifre güncellenirken bir hata oluştu." });
    } else {
      toast.success("Başarılı!", { description: "Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz." });
      setTimeout(() => navigate("/giris"), 2000);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020303] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute top-0 -left-4 w-56 h-56 md:w-72 md:h-72 bg-purple-300 rounded-full filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-56 h-56 md:w-72 md:h-72 bg-yellow-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-20 w-56 h-56 md:w-72 md:h-72 bg-pink-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <Card className="relative z-10 w-full max-w-md bg-[#090a0c]/80 backdrop-blur-sm border-[#2a2d31]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-outfit text-white">Yeni Şifre Belirle</CardTitle>
          <CardDescription className="text-[#eeeeee]">
            Lütfen yeni şifrenizi girin.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Yeni Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#151313] border-[#42484c] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Yeni Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-[#151313] border-[#42484c] text-white"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white"
            >
              {isSubmitting ? "Kaydediliyor..." : "Şifreyi Güncelle"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}