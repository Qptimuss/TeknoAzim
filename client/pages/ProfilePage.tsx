import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { getBlogPosts } from "@/lib/blog-store";
import { BlogPost } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır."),
});

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [userPosts, setUserPosts] = useState<BlogPost[]>([]);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  useEffect(() => {
    if (user) {
      const allPosts = getBlogPosts();
      setUserPosts(allPosts.filter(post => post.author === user.name));
      form.reset({ name: user.name });
    }
  }, [user, form]);

  function onSubmit(values: z.infer<typeof profileSchema>) {
    updateUser({ name: values.name });
    toast.success("Profiliniz başarıyla güncellendi!");
  }

  if (!user) {
    return null; // ProtectedRoute zaten yönlendirme yapacak
  }

  return (
    <div className="container mx-auto px-5 py-12">
      <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-8">
        Profilim
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8">
            <h2 className="text-white text-2xl font-outfit font-bold mb-4">Bilgileri Güncelle</h2>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-white/70">E-posta</label>
                  <p className="text-white">{user.email}</p>
                </div>
                <Button type="submit" className="w-full bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white">
                  Kaydet
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-white text-2xl font-outfit font-bold mb-4">Bloglarım ({userPosts.length})</h2>
          {userPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {userPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Henüz hiç blog yazısı oluşturmadınız.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}