import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Giris() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('login-with-username', {
          body: {
              username: formData.name,
              password: formData.password,
          },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        let errorMessage = data.error;
        
        if (errorMessage.includes("Invalid login credentials")) {
          errorMessage = "Geçersiz kullanıcı adı veya şifre.";
        } else if (errorMessage.includes("Email not confirmed")) {
          errorMessage = "Giriş yapmadan önce lütfen e-postanızı doğrulayın.";
        }
        
        toast.error("Giriş Hatası", { description: errorMessage });
        return;
      }

      if (data.session) {
        // Set the session received from the Edge Function
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          toast.error("Giriş Hatası", { description: "Oturum başlatılamadı: " + sessionError.message });
        } else {
          toast.success("Başarılı!", { description: "Giriş yapıldı. Yönlendiriliyorsunuz..." });
          navigate("/profil");
        }
      } else if (data.user && !data.session) {
          // This case should ideally be handled by the Edge Function returning an error if email is not confirmed, 
          // but keeping it for robustness.
          toast.info("Doğrulama Gerekli", { description: "Giriş yapmadan önce lütfen e-postanızı doğrulayın." });
      } else {
          toast.error("Giriş Hatası", { description: "Beklenmedik bir yanıt alındı. Lütfen tekrar deneyin." });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Giriş Hatası", { description: "Sunucuya ulaşılamadı veya beklenmedik bir hata oluştu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020303] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-[#090a0c] border-[#2a2d31]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-outfit text-white">Giriş Yap</CardTitle>
          <CardDescription className="text-[#eeeeee]">
            Hesabınıza erişmek için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Kullanıcı Adı</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-[#151313] border-[#42484c] text-white placeholder:text-[#999999]"
                placeholder="Kullanıcı adınız"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-[#151313] border-[#42484c] text-white placeholder:text-[#999999]"
                placeholder="••••••••"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white"
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
            <div className="text-center text-sm text-[#eeeeee]">
              Hesabınız yok mu?{" "}
              <Link to="/kaydol" className="text-white hover:underline">
                Kayıt ol
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}