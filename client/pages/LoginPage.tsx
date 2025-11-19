import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        let errorMessage = "Giriş başarısız. Lütfen e-posta veya şifrenizi kontrol edin.";

        // Supabase'in genel kimlik doğrulama hatası mesajını kontrol et.
        // Bu mesaj hem yanlış şifre hem de kayıtlı olmayan kullanıcı için döner.
        // Kullanıcının isteği doğrultusunda, bu genel hatayı daha yönlendirici bir mesaja çeviriyoruz.
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Böyle bir hesap yok, kayıt olmayı dene.";
        }
        
        toast.error(errorMessage);
        return;
      }

      if (data.user) {
        // Başarılı giriş sonrası Auth Context'i güncelle
        await login(data.user);
        toast.success("Başarıyla giriş yapıldı!");
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Beklenmedik bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-md">
      <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-8 text-center">
        Giriş Yap
      </h1>
      <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">E-posta</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ornek@eposta.com" 
                      {...field} 
                      className="bg-[#151313] border-[#42484c] text-white" 
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Şifre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Şifreniz" 
                      {...field} 
                      className="bg-[#151313] border-[#42484c] text-white" 
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              size="lg" 
              disabled={isLoading} 
              className="w-full bg-[#151313]/95 border border-[#42484c] text-white text-lg transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
            >
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Button variant="link" onClick={() => navigate("/kayit")} className="p-0 h-auto text-blue-400 hover:text-blue-300">
              Kayıt Ol
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}