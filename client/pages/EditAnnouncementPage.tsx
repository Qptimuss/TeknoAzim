import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/auth-utils";
import { getAnnouncementById, updateAnnouncement } from "@/lib/announcement-store";
import { Skeleton } from "@/components/ui/skeleton";

const announcementSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function EditAnnouncementPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const isUserAdmin = isAdmin(user);
  const [pageLoading, setPageLoading] = useState(true);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Yetki ve veri yükleme kontrolü
  useEffect(() => {
    if (authLoading) return;

    if (!isUserAdmin) {
      toast.error("Yetkisiz Erişim", { description: "Bu sayfaya sadece yöneticiler erişebilir." });
      navigate("/duyurular");
      return;
    }

    if (!id) {
      navigate("/duyurular");
      return;
    }

    const fetchAnnouncement = async () => {
      try {
        const announcement = await getAnnouncementById(id);
        form.reset({
          title: announcement.title,
          content: announcement.content,
        });
      } catch (error) {
        toast.error("Duyuru yüklenirken hata oluştu.");
        navigate("/duyurular");
      } finally {
        setPageLoading(false);
      }
    };

    fetchAnnouncement();
  }, [authLoading, isUserAdmin, navigate, id, form]);

  async function onSubmit(values: AnnouncementFormValues) {
    if (!user || !isUserAdmin || !id) return;

    // Zod resolver'dan geçtiği için values'un tam ve zorunlu alanlara sahip olduğunu biliyoruz.
    // Bu nedenle, tipi zorunlu alanlara sahip bir nesne olarak atayabiliriz.
    const updateData: { title: string; content: string } = values;

    try {
      await updateAnnouncement(id, updateData);

      toast.success("Duyuru başarıyla güncellendi!");
      navigate("/duyurular");
    } catch (error) {
      toast.error("Duyuru güncellenirken bir hata oluştu.", {
        description: error instanceof Error ? error.message : "Lütfen tekrar deneyin.",
      });
      console.error(error);
    }
  }

  if (authLoading || pageLoading) {
    return (
      <div className="container mx-auto px-5 py-12 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-3xl">
      <Link to="/duyurular" className="text-foreground hover:underline flex items-center gap-2 mb-8">
        <ArrowLeft size={20} />
        Duyurulara Geri Dön
      </Link>
      <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
        Duyuruyu Düzenle
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
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Duyuruyu Güncelle"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}