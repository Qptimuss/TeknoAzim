import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { getPostsByUserId, deleteBlogPost } from "@/lib/blog-store";
import { BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Trash2, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır."),
  avatar_url: z.string().url("Lütfen geçerli bir URL girin.").optional().or(z.literal('')),
  description: z.string().max(200, "Açıklama en fazla 200 karakter olabilir.").optional(),
});

export default function ProfilePage() {
  const { user, updateUser, loading } = useAuth();
  const [userPosts, setUserPosts] = useState<BlogPostWithAuthor[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      avatar_url: "",
      description: "",
    },
  });

  const fetchUserPosts = async (userId: string) => {
    setPostsLoading(true);
    const posts = await getPostsByUserId(userId);
    setUserPosts(posts);
    setPostsLoading(false);
  };

  useEffect(() => {
    if (user) {

      form.reset({ name: user.name || "", avatar_url: user.avatar_url || "", description: user.description || "" });
      const fetchUserPosts = async () => {
        setPostsLoading(true);
        const posts = await getPostsByUserId(user.id);
        setUserPosts(posts);
        setPostsLoading(false);
      };
      fetchUserPosts();

    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    try {
      await updateUser({ name: values.name, avatar_url: values.avatar_url || '', description: values.description || '' });
      toast.success("Profiliniz başarıyla güncellendi!");
    } catch (error) {
      toast.error("Profil güncellenirken bir hata oluştu.");
    }
  }

  const handleDeletePost = async () => {
    if (!postToDelete || !user) return;
    try {
      await deleteBlogPost(postToDelete);
      toast.success("Blog yazısı başarıyla silindi.");
      // Refresh posts list
      await fetchUserPosts(user.id);
    } catch (error) {
      toast.error("Blog yazısı silinirken bir hata oluştu.");
      console.error(error);
    } finally {
      setPostToDelete(null);
    }
  };

  if (loading) {
    return <div className="text-white text-center p-12">Yükleniyor...</div>;
  }

  if (!user) {
    return null; // ProtectedRoute handles redirection
  }

  return (
    <div className="container mx-auto px-5 py-12">
      <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-8">
        Profilim
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8">
            <div className="flex flex-col items-center mb-6 text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-white text-2xl font-outfit font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              {user.description && (
                <p className="text-white mt-4 text-sm">{user.description}</p>
              )}
            </div>
            <h3 className="text-white text-xl font-outfit font-bold mb-4 border-t border-[#2a2d31] pt-6">Bilgileri Güncelle</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-[#151313] border-[#42484c] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Profil Fotoğrafı URL'si</FormLabel>
                      <FormControl>
                        <Input placeholder="https://ornek.com/resim.jpg" {...field} value={field.value || ''} className="bg-[#151313] border-[#42484c] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Açıklama (Maks 200 karakter)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Kendinizden bahsedin..." {...field} value={field.value || ''} className="bg-[#151313] border-[#42484c] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-[#151313]/95 border border-[#42484c] text-white transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
                  Kaydet
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-white text-2xl font-outfit font-bold mb-4">Bloglarım ({userPosts.length})</h2>
          {postsLoading ? (
             <p className="text-muted-foreground">Bloglar yükleniyor...</p>
          ) : userPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {userPosts.map(post => (
                <div key={post.id} className="relative group">
                  <BlogCard post={post} />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button asChild size="icon" variant="secondary" className="bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white">
                      <Link to={`/bloglar/${post.id}/duzenle`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      onClick={() => setPostToDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Henüz hiç blog yazısı oluşturmadınız.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent className="bg-[#090a0c] border-[#2a2d31] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Blog Yazısını Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#eeeeee]">
              Bu işlem geri alınamaz. Seçtiğiniz blog yazısı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#42484c] hover:bg-[#151313]">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700 text-white">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}