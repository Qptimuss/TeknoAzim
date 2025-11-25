import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, User } from "@/contexts/AuthContext";
import { getPostsByUserId, uploadAvatar, deleteBlogPost, updateProfile, deleteAvatar } from "@/lib/blog-store";
import { BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, CheckCircle, Pencil, Check, X, Lock, Trash2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateLevel, ALL_BADGES, TITLES, removeExp, EXP_ACTIONS } from "@/lib/gamification";
import CreateBlogCard from "@/components/CreateBlogCard";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FRAMES } from "@/lib/store-items";
import NovaFrame from "@/components/frames/NovaFrame";
import ImageViewerDialog from "@/components/ImageViewerDialog";

export default function ProfilePage() {
  const { user, saveProfileDetails, updateUser, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<BlogPostWithAuthor[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postToDelete, setPostToDelete] = useState<{id: string, imageUrl?: string | null} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Inline editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false); // NEW
  const [isSavingDescription, setIsSavingDescription] = useState(false); // NEW
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  
  // Cropping States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Account Deletion States
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Avatar Deletion States
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);


  useEffect(() => {
    return () => {
      if (imageToCrop) URL.revokeObjectURL(imageToCrop);
    };
  }, [imageToCrop]);

  useEffect(() => {
    if (user) {
      setNameValue(user.name || "");
      setDescriptionValue(user.description || "");
      
      const fetchUserPosts = async () => {
        setPostsLoading(true);
        const posts = await getPostsByUserId(user.id);
        setUserPosts(posts);
        setPostsLoading(false);
      };
      fetchUserPosts();
    }
  }, [user]);

  const handleTitleChange = async (newTitle: string) => {
    if (!user) return;
    const updateData = { selected_title: newTitle === 'none' ? null : newTitle };
    
    await toast.promise(saveProfileDetails(updateData), {
      loading: 'Ünvan kaydediliyor...',
      success: 'Ünvan güncellendi.',
      error: 'Hata oluştu.',
    });
  };

  const handleFrameSelect = async (frameName: string) => {
    if (!user) return;

    let updateData: Partial<User>;
    let successMessage: string;

    if (user.selected_frame === frameName) {
      updateData = { selected_frame: null };
      successMessage = 'Çerçeve kaldırıldı.';
    } else {
      updateData = { selected_frame: frameName };
      successMessage = 'Çerçeve güncellendi!';
    }

    await toast.promise(saveProfileDetails(updateData), {
      loading: 'İşleniyor...',
      success: successMessage,
      error: 'Hata oluştu.',
    });
  };

  const handleNameSave = async () => {
    if (!user) return;
    
    if (nameValue === user.name) {
      setIsEditingName(false);
      return;
    }

    const result = z.string().min(2, "İsim en az 2 karakter olmalıdır.").safeParse(nameValue);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setNameValue(user.name || "");
      return;
    }
    
    setIsSavingName(true);
    try {
      await saveProfileDetails({ name: nameValue });
      toast.success('İsim güncellendi!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      toast.error("İsim Güncelleme Hatası", { description: errorMessage });
      setNameValue(user.name || ""); // Revert local state on error
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setNameValue(user?.name || "");
  };

  const handleDescriptionSave = async () => {
    if (!user) return;
    
    if (descriptionValue === user.description) {
      setIsEditingDescription(false);
      return;
    }

    const result = z.string().max(200, "Açıklama en fazla 200 karakter olabilir.").optional().safeParse(descriptionValue);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setDescriptionValue(user.description || "");
      return;
    }
    
    setIsSavingDescription(true);
    try {
      await saveProfileDetails({ description: descriptionValue });
      toast.success('Açıklama güncellendi!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      toast.error("Açıklama Güncelleme Hatası", { description: errorMessage });
      setDescriptionValue(user.description || ""); // Revert local state on error
    } finally {
      setIsSavingDescription(false);
      setIsEditingDescription(false);
    }
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
    setDescriptionValue(user?.description || "");
  };

  const handleAvatarEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 4 * 1024 * 1024) { // 4MB
        toast.error("Resim boyutu 4MB'den küçük olmalıdır.");
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

    const croppedFile = new File([croppedBlob], `${user.id}.jpeg`, { type: "image/jpeg" });
    
    await toast.promise(
      async () => {
        const uploadedUrl = await uploadAvatar(croppedFile, user.id);
        if (uploadedUrl) {
          const cacheBustingUrl = `${uploadedUrl}?v=${Date.now()}`;
          await saveProfileDetails({ avatar_url: cacheBustingUrl });
        }
      },
      {
        loading: "Profil fotoğrafı yükleniyor...",
        success: "Profil fotoğrafı güncellendi!",
        error: (e) => {
          console.error("Avatar update failed:", e);
          return e.message || "Profil fotoğrafı güncellenirken bir hata oluştu.";
        },
      }
    );
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;
    setIsDeletingAvatar(true);
    try {
      await deleteAvatar(user.avatar_url || "");
      await saveProfileDetails({ avatar_url: null });
      toast.success("Profil fotoğrafı başarıyla silindi.");
    } catch (error) {
      toast.error("Profil fotoğrafı silinirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsDeletingAvatar(false);
      setShowDeleteAvatarDialog(false);
    }
  };

  const handleDeleteRequest = (postId: string, imageUrl?: string | null) => {
    setPostToDelete({ id: postId, imageUrl });
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete || !user) return;
    setIsDeleting(true);
    try {
      await deleteBlogPost(postToDelete.id, postToDelete.imageUrl);
      setUserPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      
      const updatedProfile = await removeExp(user.id, EXP_ACTIONS.REMOVE_POST);
      if (updatedProfile) {
        updateUser(updatedProfile);
      }

      toast.success("Blog yazısı başarıyla silindi.");
    } catch (error) {
      toast.error("Blog yazısı silinirken bir hata oluştu.");
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Kimlik doğrulama oturumu bulunamadı.");
      }

      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Hesap silinemedi.' }));
        throw new Error(errorData.error);
      }

      toast.success("Hesabınız başarıyla silindi.");
      await logout(); 
      navigate('/');

    } catch (error) {
      toast.error("Hesap silinirken bir hata oluştu.", {
        description: error instanceof Error ? error.message : "Lütfen tekrar deneyin.",
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
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

  const selectedTitleObject = Object.values(TITLES).find(t => t.name === user.selected_title);
  const SelectedTitleIcon = selectedTitleObject ? selectedTitleObject.icon : CheckCircle;
  const selectedFrame = FRAMES.find(f => f.name === user.selected_frame);

  const AvatarPreview = ({ sizeClass = "h-20 w-20" }: { sizeClass?: string }) => (
    <Avatar className={sizeClass}>
      <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
      <AvatarFallback>
        <UserIcon className="h-4/6 w-4/6" />
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <div className="container mx-auto px-5 py-12">
        <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
          Profilim
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex flex-col items-center mb-6 space-y-2 text-center">
                
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => user.avatar_url && setIsViewerOpen(true)}
                    disabled={!user.avatar_url}
                    className="disabled:cursor-default"
                  >
                    {user.selected_frame === 'Nova' ? (
                      <NovaFrame>
                        <AvatarPreview sizeClass="h-24 w-24" />
                      </NovaFrame>
                    ) : (
                      <div className={cn("p-1", selectedFrame?.className)}>
                        <AvatarPreview sizeClass="h-24 w-24" />
                      </div>
                    )}
                  </button>
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={handleAvatarEditClick}
                      title="Fotoğrafı Değiştir"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {user.avatar_url && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500 hover:bg-red-500/10" 
                        onClick={() => setShowDeleteAvatarDialog(true)}
                        title="Fotoğrafı Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input type="file" accept="image/png, image/jpeg, image/gif" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files)} className="hidden" />

                <div className="flex min-h-[40px] items-center justify-center gap-2">
                  {isEditingName ? (
                    <>
                      <Input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); }}
                        autoFocus
                        className="w-48 text-center text-2xl font-bold font-outfit h-auto"
                        disabled={isSavingName}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-green-500 hover:bg-green-500/10" 
                        onClick={handleNameSave}
                        disabled={isSavingName}
                      >
                        {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={handleNameCancel} disabled={isSavingName}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-card-foreground text-2xl font-outfit font-bold">{user.name}</h2>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingName(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {user.selected_title && (
                  <p className="text-yellow-400 font-semibold text-sm flex items-center justify-center gap-1">
                    <SelectedTitleIcon className="h-4 w-4" /> {user.selected_title}
                  </p>
                )}
                
                <p className="text-muted-foreground">{user.email}</p>
                
                <div className="flex w-full items-start justify-center gap-2">
                  {isEditingDescription ? (
                    <>
                      <Textarea
                        value={descriptionValue}
                        onChange={(e) => setDescriptionValue(e.target.value)}
                        autoFocus
                        placeholder="Kendinizden bahsedin..."
                        className="w-full max-w-xs text-sm text-center min-h-[80px]"
                        disabled={isSavingDescription}
                      />
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-500 hover:bg-green-500/10" 
                          onClick={handleDescriptionSave}
                          disabled={isSavingDescription}
                        >
                          {isSavingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={handleDescriptionCancel} disabled={isSavingDescription}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-card-foreground text-sm text-center min-h-[24px] max-w-xs">
                        {user.description || <span className="text-muted-foreground italic">Açıklama ekle...</span>}
                      </p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingDescription(true)}>
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

              <div className="mb-6 border-t border-border pt-6">
                <h3 className="text-card-foreground text-xl font-outfit font-bold mb-4">Ünvanlar</h3>
                <RadioGroup
                  value={user.selected_title || 'none'}
                  onValueChange={handleTitleChange}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="none" id="title-none" />
                    <Label htmlFor="title-none" className="italic text-muted-foreground">Ünvan Yok</Label>
                  </div>
                  {Object.entries(TITLES).map(([levelKey, titleObject]) => {
                    const { name: title, icon: Icon } = titleObject;
                    const levelRequired = parseInt(levelKey);
                    const isUnlocked = level >= levelRequired;
                    return (
                      <div key={title} className="flex items-center space-x-3">
                        <RadioGroupItem value={title} id={`title-${levelKey}`} disabled={!isUnlocked} />
                        <Label
                          htmlFor={`title-${levelKey}`}
                          className={cn(
                            "flex items-center gap-2 w-full",
                            !isUnlocked && "text-muted-foreground opacity-60 cursor-not-allowed"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{title}</span>
                          {!isUnlocked && (
                            <span className="ml-auto flex items-center gap-1 text-xs">
                              <Lock className="h-3 w-3" />
                              Seviye {levelRequired}
                            </span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="mb-6 border-t border-border pt-6">
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

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-destructive text-xl font-outfit font-bold mb-4">Tehlikeli Bölge</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Hesabınızı silmek kalıcı bir eylemdir ve geri alınamaz. Tüm blog yazılarınız ve verileriniz silinecektir.
                </p>
                <Button variant="destructive" className="w-full" onClick={() => setShowDeleteAccountDialog(true)}>
                  Hesabımı Sil
                </Button>
              </div>
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
                    hideProfileLink={true}
                  />
                ))}
                <CreateBlogCard />
              </div>
            )}
            
            <div className="mt-8 bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-outfit font-bold mb-4">Çerçevelerim</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {FRAMES.map((frame) => {
                  const isOwned = user.owned_frames?.includes(frame.name) ?? false;
                  const isSelected = user.selected_frame === frame.name;
                  return (
                    <div key={frame.name} className="flex flex-col items-center gap-2">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-28 h-28 p-0 rounded-lg border-2 flex items-center justify-center relative transition-all",
                          isSelected ? "border-primary ring-2 ring-primary" : "border-border",
                          !isOwned && "opacity-50 grayscale cursor-not-allowed"
                        )}
                        onClick={() => isOwned && handleFrameSelect(frame.name)}
                        disabled={!isOwned}
                      >
                        {frame.name === 'Nova' ? (
                          <div className="w-24 h-24 flex items-center justify-center">
                            <NovaFrame>
                              <AvatarPreview sizeClass="h-20 w-20" />
                            </NovaFrame>
                          </div>
                        ) : (
                          <div className={cn("w-24 h-24 flex items-center justify-center", frame.className)}>
                            <AvatarPreview sizeClass="h-20 w-20" />
                          </div>
                        )}
                        {!isOwned && <Lock className="absolute bottom-1 right-1 h-4 w-4 text-foreground bg-background rounded-full p-0.5" />}
                        {isSelected && <CheckCircle className="absolute top-1 right-1 h-5 w-5 text-primary bg-background rounded-full" />}
                      </Button>
                      <p className="text-xs text-center font-medium">{frame.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Blog Yazısını Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. Blog yazınız, tüm yorumları ve oylarıyla birlikte kalıcı olarak silinecektir.
                <span className="font-bold text-destructive"> Ayrıca, bu gönderiden kazandığınız 25 EXP'yi kaybedeceksiniz.</span>
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

      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabınızı Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Tüm blog yazılarınız, yorumlarınız ve profil verileriniz kalıcı olarak silinecektir. Bu işlemi onaylıyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingAccount ? "Siliniyor..." : "Evet, Hesabımı Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAvatarDialog} onOpenChange={setShowDeleteAvatarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profil Fotoğrafını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Mevcut profil fotoğrafınızı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAvatar}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAvatar}
              disabled={isDeletingAvatar}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingAvatar ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {user.avatar_url && (
        <ImageViewerDialog
          open={isViewerOpen}
          onOpenChange={setIsViewerOpen}
          imageUrl={user.avatar_url}
          imageAlt={user.name || "Profil Fotoğrafı"}
        />
      )}
    </>
  );
}