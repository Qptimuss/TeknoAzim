import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Giris() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simüle edilmiş kullanıcı adı
      const userName = formData.email.split('@')[0];
      login({ name: userName, email: formData.email });

      toast({
        title: "Başarılı",
        description: "Giriş başarılı! Profilinize yönlendiriliyorsunuz.",
      });
      
      setTimeout(() => navigate("/profil"), 1500);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Giriş işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
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
              <Label htmlFor="email" className="text-white">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-[#151313] border-[#42484c] text-white placeholder:text-[#999999]"
                placeholder="ornek@email.com"
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