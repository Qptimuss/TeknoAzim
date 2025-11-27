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
import { useAuth, User } from "@/contexts/AuthContext";
import { addExp, awardBadge, EXP_ACTIONS, calculateLevel } from "@/lib/gamification";
import { Loader2 } from "lucide-react"; // Import Loader2

const blogSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
  imageFile: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= 4 * 1024 * 1024, // 4MB
      `Resim boyutu 4MB'den küçük olmalıdır.`
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
      const userPosts = await getPostsByUserId(user.id);
      const postCountBeforeCreating = userPosts.length;
      const levelBefore = user.level;
      let latestProfileState: User | null = { ...user };

      let imageUrl: string | undefined = undefined;
      if (values.imageFile && values.imageFile.length > 0) {
        toast.info("Resim yükleniyor...");
        const file = values.imageFile[0];
        const uploadedUrl = await uploadBlogImage(file, user.id);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      await addBlogPost({ 
        title: values.title,
        content: values.content,
        userId: user.id,
        imageUrl,
      });

      // --- Gamification Logic ---
      
      // 1. Blog yayınladığı için EXP ver.
      const profileAfterPost = await addExp(EXP_ACTIONS.CREATE_POST);
      if (profileAfterPost) latestProfileState = profileAfterPost;
      
      // 2. Rozetleri kontrol et
      let awardedBadgeName: string | null = null;
      if (postCountBeforeCreating === 0) awardedBadgeName = "İlk Blog";
      if (postCountBeforeCreating === 1) awardedBadgeName = "Hevesli Katılımcı";
      if (postCountBeforeCreating === 4) awardedBadgeName = "Topluluk İnşacısı";

      if (awardedBadgeName) {
        const profileAfterBadge = await awardBadge(awardedBadgeName);
        if (profileAfterBadge) latestProfileState = profileAfterBadge;
        toast.success("Yeni Rozet Kazandın!", {
          description: `"${awardedBadgeName}" rozetini kazandın, 50 EXP ve 30 Gem elde ettin!`,
        });
      }

      // 3. Auth Context'i en güncel ve nihai profil durumuyla güncelle ve seviye atlama bildirimi göster.
      if (latestProfileState) {
        updateUser(latestProfileState);
        if (latestProfileState.level > levelBefore) {
          toast.success(`Tebrikler! Seviye ${latestProfileState.level} oldun!`);
        }
      }

      toast.success("Blog yazınız başarıyla oluşturuldu!");
      navigate("/bloglar");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      
      if (errorMessage.includes("uygunsuz içerik barındırdığı için reddedildi")) {
        toast.error("İçerik Reddedildi", { description: errorMessage });
      } else {
        toast.error("Blog yazısı oluşturulurken bir hata oluştu.", { description: errorMessage });
      }
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
                  <FormLabel>Kapak Resmi (İsteğe Bağlı, Maks 4MB)</FormLabel>
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
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yayınlanıyor...
                </>
              ) : (
                "Yayınla"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              İçerikler yapay zeka tarafından filtrelendiğinden gönderim işleminde gecikme olabilir.
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}