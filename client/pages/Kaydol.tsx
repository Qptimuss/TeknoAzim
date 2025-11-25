import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Kaydol() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [searchParams] = useSearchParams();
  
  const initialEmail = searchParams.get('email') || "";
  const initialPassword = searchParams.get('password') || "";

  const [formData, setFormData] = useState({
    name: "",
    email: initialEmail,
    password: initialPassword,
    confirmPassword: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      email: initialEmail,
      password: initialPassword,
      confirmPassword: "",
    }));
  }, [initialEmail, initialPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    setIsSubmitting(true);
    
    // Removed client-side profile check to prevent username enumeration.
    // We rely on the database trigger/constraint to handle username uniqueness 
    // during or immediately after signup, and provide a generic error message if it fails.

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(formData.name)}`
        }
      }
    });

    setIsSubmitting(false);

    if (error) {
      let description = error.message;
      
      // If the error is due to a database constraint (like unique username), 
      // we must generalize the message to prevent enumeration.
      if (error.message.includes("duplicate key value violates unique constraint")) {
        description = "Kayıt başarısız oldu. Lütfen girdiğiniz bilgileri kontrol edin (Kullanıcı adı veya e-posta zaten kullanılıyor olabilir).";
      } else if (error.message.includes("User already registered")) {
        description = "Bu e-posta adresi zaten kayıtlı.";
      }
      
      toast.error("Kayıt Hatası", { description });
    } else {
      setShowSuccessDialog(true);
    }
  };

  const handleNavigateToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.email) params.set('email', formData.email);
    if (formData.password) params.set('password', formData.password);
    navigate(`/giris?${params.toString()}`);
  };

  return (
    <>
      <div className="relative min-h-screen bg-background flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="absolute top-0 -left-4 w-40 h-40 md:w-72 md:h-72 bg-purple-300 rounded-full filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-40 h-40 md:w-72 md:h-72 bg-yellow-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 md:w-72 md:h-72 bg-pink-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        <Card className="relative z-10 w-full max-w-md bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-outfit text-card-foreground">Hesap Oluştur</CardTitle>
            <CardDescription>
              Yeni bir hesap oluşturmak için bilgilerinizi girin. Kullanıcı adınız benzersiz olmalıdır.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kullanıcı Adı</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required placeholder="Kullanıcı adınız" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="ornek@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Oluşturuluyor..." : "Hesap Oluştur"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Zaten hesabınız var mı?{" "}
                <Link to="/giris" onClick={handleNavigateToLogin} className="text-primary hover:underline">
                  Giriş yap
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kayıt Başarılı!</AlertDialogTitle>
            <AlertDialogDescription>
              Hesabınız başarıyla oluşturuldu. Lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı aktive edin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => navigate("/giris")}
            >
              Giriş Yap Sayfasına Git
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}