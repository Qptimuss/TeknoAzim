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
  const [isResending, setIsResending] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
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
    setShowResendLink(false);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.message === "Invalid login credentials") {
        toast.error("Giriş Hatası", { description: "Geçersiz e-posta veya şifre." });
      } else if (error.message === 'Email not confirmed') {
        toast.error("Giriş Hatası", { description: "Giriş yapmadan önce lütfen e-postanızı doğrulayın." });
        setShowResendLink(true);
      } else {
        toast.error("Giriş Hatası", { description: error.message });
      }
    } else {
      toast.success("Giriş başarılı!", { description: "Yönlendiriliyorsunuz..." });
      navigate("/profil");
    }
  };

  const handleResendVerification = async () => {
    if (isResending || !formData.email) return;
    setIsResending(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
    });

    setIsResending(false);

    if (error) {
      toast.error("Gönderim Hatası", { description: error.message });
    } else {
      toast.success("Doğrulama e-postası gönderildi!", { description: "Lütfen gelen kutunuzu kontrol edin." });
      setShowResendLink(false);
    }
  };

  const handleNavigateToRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.email) params.set('email', formData.email);
    if (formData.password) params.set('password', formData.password);
    navigate(`/kaydol?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute top-0 -left-4 w-40 h-40 md:w-72 md:h-72 bg-purple-300 rounded-full filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-40 h-40 md:w-72 md:h-72 bg-yellow-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-20 w-40 h-40 md:w-72 md:h-72 bg-pink-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <Card className="relative z-10 w-full max-w-md bg-card/80 backdrop-blur-sm border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-outfit text-card-foreground">Giriş Yap</CardTitle>
          <CardDescription>
            Hesabınıza erişmek için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="ornek@email.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Şifre</Label>
                <Link to="/sifremi-unuttum" className="text-sm text-primary hover:underline">
                  Şifreni mi unuttun?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
            {showResendLink && (
              <div className="text-center text-sm text-muted-foreground w-full">
                E-postanızı doğrulamadınız.{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-primary hover:underline"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? "Gönderiliyor..." : "Tekrar gönder"}
                </Button>
              </div>
            )}
            <div className="text-center text-sm text-muted-foreground">
              Hesabınız yok mu?{" "}
              <Link to="/kaydol" onClick={handleNavigateToRegister} className="text-primary hover:underline">
                Kayıt ol
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}