import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/lib/api-utils";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/auth-utils";
import { useEffect } from "react";

const announcementSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function CreateAnnouncementPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isUserAdmin = isAdmin(user);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isUserAdmin) {
      toast.error("Yetkisiz Erişim", { description: "Bu sayfaya sadece yöneticiler erişebilir." });
      navigate("/duyurular");
    }
  }, [authLoading, isUserAdmin, navigate]);

  async function onSubmit(values: AnnouncementFormValues) {
    if (!user || !isUserAdmin) {
      toast.error("Yetkisiz işlem.");
      return;
    }

    try {
      // fetchWithAuth handles headers and response checking
      await fetchWithAuth('/api/announcement', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      toast.success("Duyuru başarıyla oluşturuldu!");
      form.reset();
      navigate("/duyurular");
    } catch (error) {
      toast.error("Duyuru oluşturulurken bir hata oluştu.", {
        description: error instanceof Error ? error.message : "Lütfen tekrar deneyin.",
      });
      console.error(error);
    }
  }

  if (authLoading || !isUserAdmin) {
    return <div className="text-foreground text-center p-12">Yetki kontrol ediliyor...</div>;
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-3xl">
      <Link to="/duyurular" className="text-foreground hover:underline flex items-center gap-2 mb-8">
        <ArrowLeft size={20} />
        Duyurulara Geri Dön
      </Link>
      <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
        Yeni Duyuru Oluştur
      </h1>
      <div className="bg-card border border-border rounded-lg p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Duyuru Başlığı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İçerik</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Duyuru içeriğini buraya yazın..." {...field} className="min-h-[200px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full text-lg">
              {form.formState.isSubmitting ? "Yayınlanıyor..." : "Duyuruyu Yayınla"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}