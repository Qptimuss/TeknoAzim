import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { getPostsByUserId, uploadAvatar, deleteBlogPost } from "@/lib/blog-store";
import { BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, CheckCircle, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateLevel, ALL_BADGES, TITLES } from "@/lib/gamification";
import CreateBlogCard from "@/components/CreateBlogCard";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import ImageCropperDialog from "@/components/ImageCropperDialog";

const titleSchema = z.object({
  selected_title: z.string().optional(),
});

export default function ProfilePage() {
  const { user, updateUser, loading } = useAuth();
  const [userPosts, setUserPosts] = useState<BlogPostWithAuthor[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postToDelete, setPostToDelete] = useState<{id: string, imageUrl?: string | null} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");

  // Cropping States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const form = useForm<z.infer<typeof titleSchema>>({
    resolver: zodResolver(titleSchema),
    defaultValues: { selected_title: "" },
  });

  const { isDirty } = form.formState;
  const watchedTitle = form.watch("selected_title");

  useEffect(() => {
    return () => {
      if (imageToCrop) URL.revokeObjectURL(imageToCrop);
    };
  }, [imageToCrop]);

  useEffect(() => {
    if (user) {
      setNameValue(user.name || "");
      setDescriptionValue(user.description || "");
      form.reset({ selected_title: user.selected_title || "" });
      
      const fetchUserPosts = async () => {
        setPostsLoading(true);
        const posts = await getPostsByUserId(user.id);
        setUserPosts(posts);
        setPostsLoading(false);
      };
      fetchUserPosts();
    }
  }, [user, form]);

  // Autosave for title dropdown
  useEffect(() => {
    if (!isDirty || !user) return;

    const handler = setTimeout(async () => {
      const newTitle = form.getValues().selected_title;
      const updateData = { selected_title: newTitle === 'none' ? null : newTitle };
      
      await toast.promise(updateUser(updateData), {
        loading: 'Ünvan kaydediliyor...',
        success: 'Ünvan güncellendi.',
        error: 'Hata oluştu.',
      });
      form.reset({ selected_title: newTitle });
    }, 1000);

    return () => clearTimeout(handler);
  }, [watchedTitle, isDirty, user, updateUser, form]);

  const handleNameSave = async () => {
    setIsEditingName(false);
    if (user && nameValue !== user.name) {
      const result = z.string().min(2, "İsim en az 2 karakter olmalıdır.").safeParse(nameValue);
      if (!result.success) {
        toast.error(result.error.issues[0].message);
        setNameValue(user.name || "");
        return;
      }
      await toast.promise(updateUser({ name: nameValue }), {
        loading: 'İsim güncelleniyor...',
        success: 'İsim güncellendi!',
        error: 'Hata oluştu.',
      });
    }
  };

  const handleDescriptionSave = async () => {
    setIsEditingDescription(false);
    if (user && descriptionValue !== user.description) {
      const result = z.string().max(200, "Açıklama en fazla 200 karakter olabilir.").optional().safeParse(descriptionValue);
      if (!result.success) {
        toast.error(result.error.issues[0].message);
        setDescriptionValue(user.description || "");
        return;
      }
      await toast.promise(updateUser({ description: descriptionValue }), {
        loading: 'Açıklama güncelleniyor...',
        success: 'Açıklama güncellendi!',
        error: 'Hata oluştu.',
      });
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Resim boyutu 2MB'den küçük olmalıdır.");
        return;
      }
      const newUrl = URL.createObjectURL(file);
      setImageToCrop(newUrl);
      setIsCropperOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    if (imageToCrop) URL.revokeObjectURL(imageToCrop);
    setImageToCrop(null);
    if (!user) return;

    const croppedFile = new File([croppedBlob], "avatar.jpeg", { type: "image/jpeg" });
    await toast.promise(
      async () => {
        const uploadedUrl = await uploadAvatar(croppedFile, user.id);
        if (uploadedUrl) await updateUser({ avatar_url: uploadedUrl });
      },
      {
        loading: "Profil fotoğrafı yükleniyor...",
        success: "Profil fotoğrafı güncellendi!",
        error: "Profil fotoğrafı güncellenirken bir hata oluştu.",
      }
    );
  };

  const handleDeleteRequest = (postId: string, imageUrl?: string | null) => {
    setPostToDelete({ id: postId, imageUrl });
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBlogPost(postToDelete.id, postToDelete.imageUrl);
      setUserPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      toast.success("Blog yazısı başarıyla silindi.");
    } catch (error) {
      toast.error("Blog yazısı silinirken bir hata oluştu.");
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  if (loading) {
    return <div className="text-foreground text-center p-12">Yükleniyor...</div>;
  }

  if (!user) {
    return null;
  }

  const { level, expForNextLevel, currentLevelExp } = calculateLevel(user.exp || 0);
  const expInCurrentLevel = (user.exp || 0) - currentLevelExp;
  const expProgress = expForNextLevel === 0 ? 100 : (expInCurrentLevel / expForNextLevel) * 100;
  const unlockedTitles = Object.entries(TITLES)
    .filter(([levelKey]) => level >= parseInt(levelKey))
    .map(([, title]) => title);

  return (
    <>
      <div className="container mx-auto px-5 py-12">
        <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
          Profilim
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex flex-col items-center mb-6 text-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
                    <AvatarFallback>
                      <UserIcon className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold">Değiştir</p>
                  </div>
                </button>
                <Input type="file" accept="image/png, image/jpeg, image/gif" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files)} className="hidden" />

                <div className="flex items-center gap-2 group relative">
                  {isEditingName ? (
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); }}
                      autoFocus
                      className="text-2xl font-outfit font-bold text-center h-auto"
                    />
                  ) : (
                    <>
                      <h2 className="text-card-foreground text-2xl font-outfit font-bold">{user.name}</h2>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setIsEditingName(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {user.selected_title && (
                  <p className="text-yellow-400 font-semibold text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {user.selected_title}
                  </p>
                )}
                <p className="text-muted-foreground mt-1">{user.email}</p>
                
                <div className="flex items-start gap-2 group relative mt-2 w-full">
                  {isEditingDescription ? (
                    <Textarea
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      onBlur={handleDescriptionSave}
                      autoFocus
                      placeholder="Kendinizden bahsedin..."
                      className="text-sm text-center min-h-[80px]"
                    />
                  ) : (
                    <>
                      <p className="text-card-foreground text-sm text-center flex-1 min-h-[24px]">
                        {user.description || <span className="text-muted-foreground italic">Açıklama ekle...</span>}
                      </p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setIsEditingDescription(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6 border-t border-border pt-6">
                <h3 className="text-card-foreground text-xl font-outfit font-bold mb-4 text-center">Seviye {level}</h3>
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

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-card-foreground text-xl font-outfit font-bold">Rozetler</h3>
                  <span className="text-sm text-muted-foreground">
                    {user.badges?.length || 0} / {ALL_BADGES.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 bg-background rounded-lg border border-border">
                  {ALL_BADGES.map((badge) => {
                    const hasBadge = user.badges?.includes(badge.name);
                    const Icon = badge.icon;
                    return (
                      <div key={badge.name} className="flex items-start gap-4">
                        <div className={cn("flex items-center justify-center bg-card p-3 rounded-full border border-border shrink-0", !hasBadge && "opacity-30 grayscale")}>
                          <Icon className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{badge.name}</p>
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                          {!hasBadge && <p className="text-xs text-red-400 mt-1">(Henüz kazanılmadı)</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Bir blog oluşturmak 25 EXP, bir rozet kazanmak 50 EXP verir.
                </p>
              </div>

              <Form {...form}>
                <form className="space-y-6 border-t border-border pt-6">
                  <FormField
                    control={form.control}
                    name="selected_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ünvan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'none'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Bir ünvan seç..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                </form>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-foreground text-2xl font-outfit font-bold mb-4">Bloglarım ({userPosts.length})</h2>
            {postsLoading ? (
              <p className="text-muted-foreground">Bloglar yükleniyor...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {userPosts.map(post => (
                  <BlogCard 
                    key={post.id} 
                    post={post} 
                    showDelete={true}
                    onDelete={handleDeleteRequest}
                  />
                ))}
                <CreateBlogCard />
              </div>
            )}
          </div>
        </div>

        <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Blog Yazısını Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. Blog yazınız, tüm yorumları ve oylarıyla birlikte kalıcı olarak silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                {isDeleting ? "Siliniyor..." : "Sil"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {imageToCrop && (
        <ImageCropperDialog
          imageSrc={imageToCrop}
          open={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            if (imageToCrop) URL.revokeObjectURL(imageToCrop);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}