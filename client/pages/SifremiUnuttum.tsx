import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SifremiUnuttum() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Hata", { description: "Şifre sıfırlama bağlantısı gönderilirken bir sorun oluştu." });
    } else {
      toast.success("E-posta Gönderildi", { description: "Şifre sıfırlama talimatları için lütfen e-posta kutunuzu kontrol edin." });
    }
  };

  return (
    <div className="relative flex-grow flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute top-0 -left-4 w-40 h-40 md:w-72 md:h-72 bg-purple-300 rounded-full filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-40 h-40 md:w-72 md:h-72 bg-yellow-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-20 w-40 h-40 md:w-72 md:h-72 bg-pink-300 rounded-full filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <Card className="relative z-10 w-full max-w-md bg-[#090a0c]/80 backdrop-blur-sm border-[#2a2d31]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-outfit text-white">Şifreni Sıfırla</CardTitle>
          <CardDescription className="text-[#eeeeee]">
            Hesabınıza ait e-posta adresini girin. Size şifrenizi sıfırlamanız için bir bağlantı göndereceğiz.
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#151313] border-[#42484c] text-white placeholder:text-[#999999]"
                placeholder="ornek@email.com"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#151313]/95 border border-[#42484c] text-white transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
            >
              {isSubmitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
            </Button>
            <div className="text-center text-sm text-[#eeeeee]">
              <Link to="/giris" className="text-white hover:underline">
                Giriş yapmaya geri dön
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}