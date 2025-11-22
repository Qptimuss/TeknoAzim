import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { addBlogPost, uploadBlogImage, getPostsByUserId } from "@/lib/blog-store";
import { useAuth } from "@/contexts/AuthContext";
import { addExp, awardBadge, EXP_ACTIONS } from "@/lib/gamification";

const blogSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
  imageFile: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= 2 * 1024 * 1024, // 2MB
      `Resim boyutu 2MB'den küçük olmalıdır.`
    ),
});

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof blogSchema>>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const imageFile = form.watch("imageFile");

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const newUrl = URL.createObjectURL(file);
      setImagePreview(newUrl);

      // Cleanup the object URL on component unmount or when file changes
      return () => URL.revokeObjectURL(newUrl);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const imageFileRef = form.register("imageFile");

  async function onSubmit(values: z.infer<typeof blogSchema>) {
    if (!user) {
      toast.error("Blog yazısı oluşturmak için giriş yapmalısınız.");
      return;
    }

    try {
      // Yeni gönderiyi eklemeden ÖNCE kullanıcının gönderi sayısını kontrol et
      const userPosts = await getPostsByUserId(user.id);
      const postCountBeforeCreating = userPosts.length;

      let imageUrl: string | undefined = undefined;
      // Resim seçildiyse yükle
      if (values.imageFile && values.imageFile.length > 0) {
        toast.info("Resim yükleniyor...");
        const file = values.imageFile[0];
        const uploadedUrl = await uploadBlogImage(file, user.id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Blog gönderisini veritabanına ekle
      await addBlogPost({ 
        title: values.title,
        content: values.content,
        userId: user.id,
        imageUrl,
      });

      // --- Oyunlaştırma Mantığı ---
      
      // 1. Blog yayınladığı için EXP ver.
      let latestProfileState = await addExp(user.id, EXP_ACTIONS.CREATE_POST);
      
      // 2. Rozetleri kontrol et
      if (postCountBeforeCreating === 0) {
        const badgeUpdate = await awardBadge(user.id, "İlk Blog");
        if (badgeUpdate) latestProfileState = badgeUpdate;
      }
      
      if (postCountBeforeCreating === 1) {
        const badgeUpdate = await awardBadge(user.id, "Hevesli Katılımcı");
        if (badgeUpdate) latestProfileState = badgeUpdate;
      }
      
      if (postCountBeforeCreating === 4) {
        const badgeUpdate = await awardBadge(user.id, "Topluluk İnşacısı");
        if (badgeUpdate) latestProfileState = badgeUpdate;
      }

      // 4. Auth Context'i en güncel ve nihai profil durumuyla güncelle.
      if (latestProfileState) {
        updateUser(latestProfileState);
      }

      toast.success("Blog yazınız başarıyla oluşturuldu!");
      navigate("/bloglar");
    } catch (error) {
      toast.error("Blog yazısı oluşturulurken bir hata oluştu.");
      console.error(error);
    }
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-3xl">
      <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
        Yeni Blog Oluştur
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
                    <Input placeholder="Blog Başlığı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapak Resmi (İsteğe Bağlı, Maks 2MB)</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      {...imageFileRef}
                      className="file:text-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Seçilen resim önizlemesi"
                  className="w-full max-h-64 object-contain rounded-md border border-border"
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İçerik</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Blog içeriğini buraya yazın..." {...field} className="min-h-[200px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full text-lg">
              {form.formState.isSubmitting ? "Yayınlanıyor..." : "Yayınla"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}