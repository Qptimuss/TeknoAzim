import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Kaydol() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basit doğrulama
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Burada gerçek bir API çağrısı yapılacak
      // Örnek: await fetch('/api/register', { method: 'POST', body: JSON.stringify(formData) })
      
      // Simülasyon için kısa bir gecikme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Başarılı",
        description: "Hesabınız oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz.",
      });
      
      // Başarılı kayıt sonrası giriş sayfasına yönlendir
      setTimeout(() => navigate("/giris"), 2000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kayıt işlemi sırasında bir hata oluştu",
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
          <CardTitle className="text-2xl font-outfit text-white">Hesap Oluştur</CardTitle>
          <CardDescription className="text-[#eeeeee]">
            Yeni bir hesap oluşturmak için bilgilerinizi girin
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
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
              {isSubmitting ? "Oluşturuluyor..." : "Hesap Oluştur"}
            </Button>
            <div className="text-center text-sm text-[#eeeeee]">
              Zaten hesabınız var mı?{" "}
              <Link to="/giris" className="text-white hover:underline">
                Giriş yap
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}