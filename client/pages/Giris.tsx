import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Giris() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: invokeResult, error: invokeError } = await supabase.functions.invoke('login-with-username', {
        body: {
            username: formData.name,
            password: formData.password,
        },
    });

    setIsSubmitting(false);

    if (invokeError) {
      let errorMessage = "Bilinmeyen bir hata oluştu.";
      try {
        const errorBody = JSON.parse(invokeError.message);
        errorMessage = errorBody.error || invokeError.message;
      } catch (e) {
        errorMessage = invokeError.message;
      }

      if (errorMessage === "Invalid login credentials") {
        errorMessage = "Geçersiz kullanıcı adı veya şifre.";
      } else if (errorMessage === "Email not confirmed") {
        errorMessage = "Giriş yapmadan önce lütfen e-postanızı doğrulayın.";
      }
      
      toast({ title: "Giriş Hatası", description: errorMessage, variant: "destructive" });

    } else if (invokeResult && invokeResult.session) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: invokeResult.session.access_token,
        refresh_token: invokeResult.session.refresh_token,
      });

      if (sessionError) {
        toast({ title: "Giriş Hatası", description: "Oturum başlatılamadı.", variant: "destructive" });
      } else {
        toast({ title: "Başarılı", description: "Giriş yapıldı. Yönlendiriliyorsunuz..." });
        navigate("/profil");
      }
    } else if (invokeResult && invokeResult.user && !invokeResult.session) {
        toast({ title: "Doğrulama Gerekli", description: "Giriş yapmadan önce lütfen e-postanızı doğrulayın.", variant: "default" });
    } else {
        toast({ title: "Giriş Hatası", description: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
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