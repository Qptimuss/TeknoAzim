import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BlogPost } from "@shared/api";
import BlogCard from "@/components/BlogCard";
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

const blogSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  author: z.string().min(2, "Yazar adı en az 2 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
  imageUrl: z.string().url("Lütfen geçerli bir URL girin.").optional().or(z.literal('')),
});

const initialBlogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Teknoloji Dünyasındaki Son Gelişmeler",
    content: "Yapay zeka ve makine öğrenmesi alanında yaşanan son gelişmeler, teknoloji dünyasını yeniden şekillendiriyor. Özellikle büyük dil modelleri, insan-bilgisayar etkileşiminde yeni bir çığır açıyor.",
    author: "Ahmet Yılmaz",
    date: "2024-05-15T10:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Sağlıklı Yaşam İçin 5 Altın Kural",
    content: "Dengeli beslenme, düzenli egzersiz, yeterli uyku, stresten uzak durma ve bol su tüketimi, sağlıklı bir yaşamın temel taşlarıdır. Bu kuralları hayatınıza entegre ederek yaşam kalitenizi artırabilirsiniz.",
    author: "Ayşe Kaya",
    date: "2024-05-14T14:30:00Z",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop",
  },
];

export default function Bloglar() {
  const [posts, setPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof blogSchema>>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      author: "",
      content: "",
      imageUrl: "",
    },
  });

  function onSubmit(values: z.infer<typeof blogSchema>) {
    const newPost: BlogPost = {
      id: Date.now().toString(),
      ...values,
      date: new Date().toISOString(),
    };
    setPosts([newPost, ...posts]);
    form.reset();
    setIsDialogOpen(false);
    toast.success("Blog yazınız başarıyla oluşturuldu!");
  }

  return (
    <div className="container mx-auto px-5 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold">
          Bloglar
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white">
              Kendi Bloğunu Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#090a0c] border-[#2a2d31] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Blog Yazısı</DialogTitle>
              <DialogDescription className="text-[#eeeeee]">
                Düşüncelerinizi paylaşmak için yeni bir blog yazısı oluşturun.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlık</FormLabel>
                      <FormControl>
                        <Input placeholder="Blog Başlığı" {...field} className="bg-[#151313] border-[#42484c] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yazar</FormLabel>
                      <FormControl>
                        <Input placeholder="Adınız" {...field} className="bg-[#151313] border-[#42484c] text-white" />
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
                        <Textarea placeholder="Blog içeriğini buraya yazın..." {...field} className="bg-[#151313] border-[#42484c] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resim URL'si (İsteğe Bağlı)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://ornek.com/resim.jpg" {...field} className="bg-[#151313] border-[#42484c] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white">
                  Oluştur
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}