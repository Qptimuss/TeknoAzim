import { useState, useEffect, useRef } from "react";
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
import { addBlogPost, uploadBlogImage, getPostsByUserId } from "@/lib/blog-store";
import { useAuth } from "@/contexts/AuthContext";
import { addExp, awardBadge, EXP_ACTIONS } from "@/lib/gamification";
import { Loader2, AlertTriangle } from "lucide-react";
import MarkdownToolbar from "@/components/MarkdownToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownPreview from "@/components/MarkdownPreview";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

type BlogFormValues = z.infer<typeof blogSchema>;

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Yeni state'ler
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const imageFile = form.watch("imageFile");
  const contentValue = form.watch("content");

  useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const newUrl = URL.createObjectURL(file);
      setImagePreview(newUrl);
      return () => URL.revokeObjectURL(newUrl);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const imageFileRef = form.register("imageFile");

  const handleRemoveImage = () => {
    form.setValue('imageFile', undefined);
    setImagePreview(null);
  };

  // Asıl yayınlama mantığı
  const publishPost = async (values: BlogFormValues) => {
    if (!user) {
      toast.error("Blog yazısı oluşturmak için giriş yapmalısınız.");
      return;
    }

    setIsPublishing(true);
    setShowPublishWarning(false); // Uyarıyı kapat

    try {
      const userPosts = await getPostsByUserId(user.id);
      const postCountBeforeCreating = userPosts.length;

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

      let latestProfileState = await addExp(user.id, EXP_ACTIONS.CREATE_POST);

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

      if (latestProfileState) updateUser(latestProfileState);

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
    } finally {
      setIsPublishing(false);
    }
  };

  // Form gönderildiğinde uyarıyı göster
  const handleFormSubmit = (values: BlogFormValues) => {
    setShowPublishWarning(true);
  };

  // Görüntülenecek resim URL'sini belirle: Yeni önizleme > Mevcut URL
  const displayImageUrl = imagePreview;

  return (
    <>
      <div className="container mx-auto px-5 py-12 max-w-3xl">
        <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
          Yeni Blog Oluştur
        </h1>
        <div className="bg-card border border-border rounded-lg p-8">
          <Form {...form}>
            {/* Formun submit handler'ı artık uyarıyı açar */}
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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

              {displayImageUrl && (
                <div className="space-y-2">
                  <FormLabel>Kapak Resmi Önizlemesi</FormLabel>
                  <img
                    src={imagePreview}
                    alt="Seçilen resim önizlemesi"
                    className="w-full max-h-64 object-cover rounded-md border border-border"
                  />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    type="button"
                    onClick={handleRemoveImage}
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
                    <FormLabel>Kapak Resmi (İsteğe Bağlı, Maks 4MB)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        {...imageFileRef} 
                        className="file:text-foreground transition-all duration-300 hover:border-primary hover:shadow-md"
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
                            <AutoResizeTextarea 
                              placeholder="Blog içeriğini buraya yazın..." 
                              {...field} 
                              ref={(e) => {
                                field.ref(e);
                                (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                              }}
                              className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-t-none min-h-[300px]" 
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
              
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || isPublishing} className="w-full text-lg">
                {form.formState.isSubmitting || isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yayınlanıyor...
                  </>
                ) : (
                  "Yayınla"
                )}
              </Button>

              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  İçerikler yapay zeka tarafından filtrelendiğinden gönderim işleminde gecikme olabilir.
                </p>
                <p className="text-xs text-red-500 font-semibold">
                  Eğer yayımlama işlemi 1 dakikadan fazla sürerse sayfayı yenileyip tekrar dene!
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Yayınlama Onay/Uyarı Penceresi */}
      <AlertDialog open={showPublishWarning} onOpenChange={setShowPublishWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              Önemli Uyarı!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-semibold text-foreground">
              Blogunu yayınlamadan önce olası sorunlar için yazını bir yere kaydet veya yazını kopyala! Blogu yayımlarken siteyi arka plana alma!
            </AlertDialogDescription>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Siteyi ekranınızda arka plana atıp geri öne alınca siteyi yenilemediğiniz sürece sitedeki yorum yazma, blog yayınlama gibi fonksiyonlar çalışmayı durduruyor bu yüzden blog yayınlama 1-2dk dan fazla sürerse siteyi yenileyip tekrar deneyin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>İptal Et</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => publishPost(form.getValues())} 
              disabled={isPublishing}
              className="bg-primary hover:bg-primary/90"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yayınlanıyor...
                </>
              ) : (
                "Kopyaladım, Yayınla"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}