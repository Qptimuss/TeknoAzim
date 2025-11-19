import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { getPostsByUserId, uploadAvatar } from "@/lib/blog-store";
import { BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateLevel, getExpForNextLevel, ALL_BADGES, TITLES } from "@/lib/gamification";
import CreateBlogCard from "@/components/CreateBlogCard";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const profileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır."),
  description: z.string().max(200, "Açıklama en fazla 200 karakter olabilir.").optional(),
  selected_title: z.string().optional(), // Ünvan alanı eklendi
  avatarFile: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= 2 * 1024 * 1024, // 2MB
      `Resim boyutu 2MB'den küçük olmalıdır.`
    ),
});

export default function ProfilePage() {
  const { user, updateUser, loading } = useAuth();
  const [userPosts, setUserPosts] = useState<BlogPostWithAuthor[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      description: "",
      selected_title: "",
    },
  });

  const avatarFile = form.watch("avatarFile");

  useEffect(() => {
    if (avatarFile && avatarFile.length > 0) {
      const file = avatarFile[0];
      const newUrl = URL.createObjectURL(file);
      setAvatarPreview(newUrl);
      return () => URL.revokeObjectURL(newUrl);
    } else {
      setAvatarPreview(null);
    }
  }, [avatarFile]);

  useEffect(() => {
    if (user) {
      form.reset({ 
        name: user.name || "", 
        description: user.description || "",
        selected_title: user.selected_title || "",
      });
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
    if (!user) return;

    try {
      let newAvatarUrl = user.avatar_url;

      if (values.avatarFile && values.avatarFile.length > 0) {
        toast.info("Profil fotoğrafı yükleniyor...");
        const file = values.avatarFile[0];
        const uploadedUrl = await uploadAvatar(file, user.id);
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        }
      }

      const profileUpdateData = {
        name: values.name,
        description: values.description || '',
        avatar_url: newAvatarUrl,
        selected_title: values.selected_title || null, // Seçili ünvanı gönder
      };

      await updateUser(profileUpdateData);
      
      form.reset({ ...values, avatarFile: undefined });
      setAvatarPreview(null);

      toast.success("Profiliniz başarıyla güncellendi!");
    } catch (error) {
      toast.error("Profil güncellenirken bir hata oluştu.");
      console.error(error);
    }
  }

  if (loading) {
    return <div className="text-white text-center p-12">Yükleniyor...</div>;
  }

  if (!user) {
    return null; // ProtectedRoute handles redirection
  }

  const { level, expForNextLevel, currentLevelExp } = calculateLevel(user.exp || 0);
  const expInCurrentLevel = (user.exp || 0) - currentLevelExp;
  const expProgress = expForNextLevel === 0 ? 100 : (expInCurrentLevel / expForNextLevel) * 100;

  // Kullanıcının seviyesine göre kilidi açılmış ünvanları al
  const unlockedTitles = Object.entries(TITLES)
    .filter(([levelKey]) => level >= parseInt(levelKey))
    .map(([, title]) => title);

  return (
    <div className="container mx-auto px-5 py-12">
      <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold mb-8">
        Profilim
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8">
            <div className="flex flex-col items-center mb-6 text-center">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={avatarPreview || user.avatar_url || undefined} alt={user.name || ''} />
                  <AvatarFallback>
                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-bold">Değiştir</p>
                </div>
              </button>
              <h2 className="text-white text-2xl font-outfit font-bold">{user.name}</h2>
              {user.selected_title && (
                <p className="text-yellow-400 font-semibold text-sm mt-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> {user.selected_title}
                </p>
              )}
              <p className="text-muted-foreground mt-1">{user.email}</p>
              {user.description && (
                <p className="text-white mt-4 text-sm">{user.description}</p>
              )}
            </div>

            {/* Gamification Section */}
            <div className="mb-6 border-t border-[#2a2d31] pt-6">
              <h3 className="text-white text-xl font-outfit font-bold mb-4 text-center">Seviye {level}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full">
                    <Progress value={expProgress} className="w-full" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toplam Deneyim: {user.exp || 0} EXP</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="text-center text-sm text-muted-foreground mt-2">
                {`${expInCurrentLevel} / ${expForNextLevel} EXP`}
              </div>
            </div>

            {/* Badges Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-xl font-outfit font-bold">Rozetler</h3>
                <span className="text-sm text-muted-foreground">
                  {user.badges?.length || 0} / {ALL_BADGES.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 bg-[#151313] rounded-lg border border-[#2a2d31]">
                {ALL_BADGES.map((badge) => {
                  const hasBadge = user.badges?.includes(badge.name);
                  const Icon = badge.icon;
                  return (
                    <div key={badge.name} className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex items-center justify-center bg-[#090a0c] p-3 rounded-full border border-[#42484c] shrink-0",
                          !hasBadge && "opacity-30 grayscale"
                        )}
                      >
                        <Icon className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{badge.name}</p>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        {!hasBadge && <p className="text-xs text-red-400 mt-1">(Henüz kazanılmadı)</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <h3 className="text-white text-xl font-outfit font-bold mb-4 border-t border-[#2a2d31] pt-6">Bilgileri Güncelle</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="avatarFile"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/png, image/jpeg, image/gif"
                          ref={fileInputRef}
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                {/* Ünvan Seçim Alanı */}
                <FormField
                  control={form.control}
                  name="selected_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Ünvan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#151313] border-[#42484c] text-white">
                            <SelectValue placeholder="Bir ünvan seç..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#151313] border-[#42484c] text-white">
                          <SelectItem value="none">Ünvan Yok</SelectItem>
                          {unlockedTitles.map(title => (
                            <SelectItem key={title} value={title}>{title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-[#151313]/95 border border-[#42484c] text-white transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
                  {form.formState.isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-white text-2xl font-outfit font-bold mb-4">Bloglarım ({userPosts.length})</h2>
          {postsLoading ? (
             <p className="text-muted-foreground">Bloglar yükleniyor...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {userPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
              <CreateBlogCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}