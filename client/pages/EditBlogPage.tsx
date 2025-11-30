import { useEffect, useRef } from "react";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import MarkdownToolbar from "@/components/MarkdownToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Yeni import
import MarkdownPreview from "@/components/MarkdownPreview"; // Yeni import

const blogSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
  existingImageUrl: z.string().optional().nullable(),
  imageFile: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= 4 * 1024 * 1024,
      `Resim boyutu 4MB'den küçük olmalıdır.`
    ),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function EditBlogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Textarea ref'i
  
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
  const contentValue = form.watch("content"); // İçerik değerini izle

  useEffect(() => {
    if (!id || authLoading) return;

    const fetchPost = async () => {
      const post = await getBlogPostById(id);
      
      if (!post) {
        toast.error("Düzenlenecek blog yazısı bulunamadı.");
        navigate("/bloglar");
        return;
      }

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
      if (values.imageFile && values.imageFile.length > 0) {
        toast.info("Yeni resim yükleniyor...");
        const file = values.imageFile[0];
        newImageUrl = await uploadBlogImage(file, user.id);
      }

      await updateBlogPost(id, { 
        title: values.title,
        content: values.content,
        imageUrl: newImageUrl,
      });

      toast.success("Blog yazınız başarıyla güncellendi!");
      navigate(`/bloglar/${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      toast.error("Blog yazısı güncellenirken bir hata oluştu.", { description: errorMessage });
      console.error(error);
    }
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-3xl">
      <Link to={`/bloglar/${id}`} className="text-foreground hover:underline flex items-center gap-2 mb-8">
        <ArrowLeft size={20} />
        Geri Dön
      </Link>
      <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
        Blog Yazısını Düzenle
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

            {form.watch('existingImageUrl') && (
              <div className="space-y-2">
                <FormLabel>Mevcut Kapak Resmi</FormLabel>
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
                  <FormLabel>Yeni Kapak Resmi (Maks 4MB)</FormLabel>
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

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İçerik</FormLabel>
                  <Tabs defaultValue="edit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">İçerik Düzenle</TabsTrigger>
                      <TabsTrigger value="preview">Görüntü Önizleme</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="p-0 mt-0">
                      <div className="border border-input rounded-md overflow-hidden">
                        <MarkdownToolbar 
                          textareaRef={textareaRef} 
                          onValueChange={field.onChange}
                        />
                        <FormControl>
                          <Textarea 
                            placeholder="Blog içeriğini buraya yazın..." 
                            {...field} 
                            ref={(e) => {
                              field.ref(e);
                              (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                            }}
                            className="min-h-[300px] border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-t-none" 
                          />
                        </FormControl>
                      </div>
                    </TabsContent>
                    <TabsContent value="preview" className="p-0 mt-0">
                      <div className="border border-input rounded-md min-h-[300px] bg-background">
                        <MarkdownPreview content={contentValue} />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full text-lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Güncelle"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}