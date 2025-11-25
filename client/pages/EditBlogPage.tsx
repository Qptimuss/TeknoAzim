import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { getBlogPostById, updateBlogPost, uploadBlogImage } from "@/lib/blog-store";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

const blogSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
  // We use a separate field for the existing image URL to display it, 
  // and imageFile for new uploads.
  existingImageUrl: z.string().optional().nullable(),
  imageFile: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= 2 * 1024 * 1024, // 2MB
      `Resim boyutu 2MB'den küçük olmalıdır.`
    ),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function EditBlogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      existingImageUrl: null,
    },
  });

  const imageFileRef = form.register("imageFile");
  const { isSubmitting } = form.formState;

  // 1. Fetch existing post data
  useEffect(() => {
    if (!id || authLoading) return;

    const fetchPost = async () => {
      const post = await getBlogPostById(id);
      
      if (!post) {
        toast.error("Düzenlenecek blog yazısı bulunamadı.");
        navigate("/bloglar");
        return;
      }

      // Check ownership
      if (user?.id !== post.user_id) {
        toast.error("Bu yazıyı düzenleme yetkiniz yok.");
        navigate(`/bloglar/${id}`);
        return;
      }

      form.reset({
        title: post.title,
        content: post.content,
        existingImageUrl: post.image_url,
        imageFile: undefined,
      });
    };

    fetchPost();
  }, [id, user, authLoading, navigate, form]);

  async function onSubmit(values: BlogFormValues) {
    if (!user || !id) return;

    let newImageUrl: string | null | undefined = values.existingImageUrl;

    try {
      // 1. Handle new image upload
      if (values.imageFile && values.imageFile.length > 0) {
        toast.info("Yeni resim yükleniyor...");
        const file = values.imageFile[0];
        const uploadedUrl = await uploadBlogImage(file, user.id);
        newImageUrl = uploadedUrl;
      }

      // 2. Update blog post
      await updateBlogPost(id, { 
        title: values.title,
        content: values.content,
        imageUrl: newImageUrl,
      });

      toast.success("Blog yazınız başarıyla güncellendi!");
      navigate(`/bloglar/${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      
      if (errorMessage.includes("uygunsuz içerik barındırdığı için reddedildi")) {
        toast.error("İçerik Reddedildi", { description: errorMessage });
      } else {
        toast.error("Blog yazısı güncellenirken bir hata oluştu.", { description: errorMessage });
      }
      console.error(error);
    }
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-3xl">
      <Link to={`/bloglar/${id}`} className="text-white hover:underline flex items-center gap-2 mb-8">
        <ArrowLeft size={20} />
        Geri Dön
      </Link>
      <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-8">
        Blog Yazısını Düzenle
      </h1>
      <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Başlık</FormLabel>
                  <FormControl>
                    <Input placeholder="Blog Başlığı" {...field} className="bg-[#151313] border-[#42484c] text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('existingImageUrl') && (
                <div className="space-y-2">
                    <FormLabel className="text-white">Mevcut Kapak Resmi</FormLabel>
                    <img src={form.watch('existingImageUrl')!} alt="Mevcut Resim" className="w-full h-40 object-cover rounded-md" />
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        type="button"
                        onClick={() => form.setValue('existingImageUrl', null)}
                    >
                        Resmi Kaldır
                    </Button>
                </div>
            )}

            <FormField
              control={form.control}
              name="imageFile"
              render={() => (
                <FormItem>
                  <FormLabel className="text-white">Yeni Kapak Resmi (Maks 2MB)</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      {...imageFileRef}
                      className="bg-[#151313] border-[#42484c] text-white file:text-white"
                    />
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
                  <FormLabel className="text-white">İçerik</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Blog içeriğini buraya yazın..." {...field} className="bg-[#151313] border-[#42484c] text-white min-h-[200px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white text-lg">
              {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}