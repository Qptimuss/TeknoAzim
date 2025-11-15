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
import { addBlogPost } from "@/lib/blog-store";
import { useAuth } from "@/contexts/AuthContext";

const blogSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır."),
  content: z.string().min(20, "İçerik en az 20 karakter olmalıdır."),
  imageUrl: z.string().url("Lütfen geçerli bir URL girin.").optional().or(z.literal('')),
});

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof blogSchema>>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      imageUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof blogSchema>) {
    if (!user) {
      toast.error("Blog yazısı oluşturmak için giriş yapmalısınız.");
      return;
    }
    try {
      await addBlogPost({ ...values, userId: user.id });
      toast.success("Blog yazınız başarıyla oluşturuldu!");
      navigate("/bloglar");
    } catch (error) {
      toast.error("Blog yazısı oluşturulurken bir hata oluştu.");
    }
  }

  return (
    <div className="container mx-auto px-5 py-12 max-w-3xl">
      <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-8">
        Yeni Blog Oluştur
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
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Resim URL'si (İsteğe Bağlı)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ornek.com/resim.jpg" {...field} />
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
            <Button type="submit" size="lg" className="w-full bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white text-lg">
              Yayınla
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}