import { useState, useEffect, useRef } from "react";
import { useAuth, User } from "@/contexts/AuthContext";
import { getPostsByUserId, uploadAvatar, deleteBlogPost, deleteAvatar } from "@/lib/blog-store";
import { calculateLevel, ALL_BADGES, TITLES, removeExp, EXP_ACTIONS } from "@/lib/gamification";
import { FRAMES } from "@/lib/store-items";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BlogCard from "@/components/BlogCard";
import CreateBlogCard from "@/components/CreateBlogCard";
import NovaFrame from "@/components/frames/NovaFrame";
import ImageCropperDialog from "@/components/ImageCropperDialog";
import ImageViewerDialog from "@/components/ImageViewerDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User as UserIcon, CheckCircle, Pencil, Check, X, Lock, Trash2, Loader2, Gem } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, saveProfileDetails, updateUser, loading, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postToDelete, setPostToDelete] = useState<{id: string, imageUrl?: string | null} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteAvatarDialog, setShowDeleteAvatarDialog] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);

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

  useEffect(() => {
    return () => { if (imageToCrop) URL.revokeObjectURL(imageToCrop); };
  }, [imageToCrop]);

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
    const isOwned = user.owned_frames?.includes(frameName);
    if (!isOwned) {
      toast.error("Bu çerçeveye sahip değilsiniz.");
      return;
    }

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
    if (!user || nameValue === user.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await saveProfileDetails({ name: nameValue });
      toast.success('İsim güncellendi!');
    } catch (error) {
      toast.error("İsim Güncelleme Hatası", { description: error instanceof Error ? error.message : "Bilinmeyen hata" });
      setNameValue(user.name || "");
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => { setIsEditingName(false); setNameValue(user?.name || ""); };

  const handleDescriptionSave = async () => {
    if (!user || descriptionValue === user.description) {
      setIsEditingDescription(false);
      return;
    }
    setIsSavingDescription(true);
    try {
      await saveProfileDetails({ description: descriptionValue });
      toast.success('Açıklama güncellendi!');
    } catch (error) {
      toast.error("Açıklama Güncelleme Hatası", { description: error instanceof Error ? error.message : "Bilinmeyen hata" });
      setDescriptionValue(user.description || "");
    } finally {
      setIsSavingDescription(false);
      setIsEditingDescription(false);
    }
  };

  const handleDescriptionCancel = () => { setIsEditingDescription(false); setDescriptionValue(user?.description || ""); };

  const handleAvatarEditClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 4 * 1024 * 1024) { toast.error("Resim boyutu 4MB'den küçük olmalıdır."); return; }
      setImageToCrop(URL.createObjectURL(file));
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
      { loading: "Profil fotoğrafı yükleniyor...", success: "Profil fotoğrafı güncellendi!", error: (e) => e.message || "Hata oluştu." }
    );
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;
    setIsDeletingAvatar(true);
    try {
      await deleteAvatar(user.avatar_url || "");
      await saveProfileDetails({ avatar_url: null });
      toast.success("Profil fotoğrafı silindi.");
    } catch { toast.error("Silme hatası."); } 
    finally { setIsDeletingAvatar(false); setShowDeleteAvatarDialog(false); }
  };

  const handleDeleteRequest = (postId: string, imageUrl?: string | null) => { setPostToDelete({ id: postId, imageUrl }); };

  const handleDeleteConfirm = async () => {
    if (!postToDelete || !user) return;
    setIsDeleting(true);
    try {
      await deleteBlogPost(postToDelete.id, postToDelete.imageUrl);
      setUserPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      const updatedProfile = await removeExp(user.id, EXP_ACTIONS.REMOVE_POST);
      if (updatedProfile) updateUser(updatedProfile);
      toast.success("Blog yazısı silindi.");
    } catch { toast.error("Silme hatası."); }
    finally { setIsDeleting(false); setPostToDelete(null); }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Oturum yok.");
      const res = await fetch('/api/user', { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!res.ok) throw new Error("Silinemedi.");
      toast.success("Hesap silindi.");
      await logout();
      navigate('/');
    } catch (error) {
      toast.error("Hesap silinirken hata.", { description: error instanceof Error ? error.message : "Bilinmeyen hata" });
    } finally { setIsDeletingAccount(false); setShowDeleteAccountDialog(false); }
  };

  if (loading) return <div className="text-center p-12">Yükleniyor...</div>;
  if (!user) return null;

  const { level, expForNextLevel, currentLevelExp } = calculateLevel(user.exp || 0);
  const expInCurrentLevel = (user.exp || 0) - currentLevelExp;
  const expProgress = expForNextLevel === 0 ? 100 : (expInCurrentLevel / expForNextLevel) * 100;

  const selectedTitleObject = Object.values(TITLES).find(t => t.name === user.selected_title);
  const SelectedTitleIcon = selectedTitleObject ? selectedTitleObject.icon : CheckCircle;
  const selectedFrame = FRAMES.find(f => f.name === user.selected_frame);
  const ownedFrames = user.owned_frames || [];

  const AvatarPreview = ({ sizeClass = "h-20 w-20" }: { sizeClass?: string }) => (
    <Avatar className={sizeClass}>
      <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
      <AvatarFallback><UserIcon className="h-4/6 w-4/6" /></AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <div className="container mx-auto px-5 py-12">
        <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
          Profilim
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Sütun: Bilgiler, Seviye, Rozetler, Ayarlar */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Profil Bilgileri */}
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="relative mb-4 group">
                  <button
                    onClick={() => user.avatar_url && setIsViewerOpen(true)}
                    disabled={!user.avatar_url}
                    className="disabled:cursor-default"
                  >
                    {user.selected_frame === 'Nova' ? (
                      <NovaFrame>
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
                          <AvatarFallback>
                            <UserIcon className="h-12 w-12 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </NovaFrame>
                    ) : (
                      <div className={cn("p-1", selectedFrame?.className)}>
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
                          <AvatarFallback>
                            <UserIcon className="h-12 w-12 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full border border-border shadow-md transition-opacity opacity-0 group-hover:opacity-100"
                    onClick={handleAvatarEditClick}
                    title="Fotoğrafı Değiştir"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                
                {/* İsim Düzenleme */}
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      disabled={isSavingName}
                      className="h-8 text-xl font-outfit font-bold text-center"
                    />
                  ) : (
                    <h2 className="text-card-foreground text-2xl font-outfit font-bold">{user.name}</h2>
                  )}
                  {isEditingName ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={handleNameSave} disabled={isSavingName || nameValue.length < 2}>
                        {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleNameCancel} disabled={isSavingName}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)} className="h-6 w-6">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Ünvan */}
                {user.selected_title && (
                  <p className="text-yellow-400 font-semibold text-sm mt-1 flex items-center gap-1">
                    <SelectedTitleIcon className="h-4 w-4" /> {user.selected_title}
                  </p>
                )}

                {/* Açıklama Düzenleme */}
                <div className="w-full mt-2">
                  {isEditingDescription ? (
                    <Textarea
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      disabled={isSavingDescription}
                      className="min-h-[80px] text-center"
                      maxLength={200}
                    />
                  ) : (
                    <p className="text-muted-foreground min-h-[20px] whitespace-pre-wrap">{user.description || "Henüz bir açıklama eklenmedi."}</p>
                  )}
                  <div className="flex justify-end gap-1 mt-2">
                    {isEditingDescription ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={handleDescriptionSave} disabled={isSavingDescription}>
                          {isSavingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleDescriptionCancel} disabled={isSavingDescription}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => setIsEditingDescription(true)} className="h-6 w-6">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seviye ve EXP */}
            <div className="bg-card border border-border rounded-lg p-8">
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
              <div className="flex items-center justify-center gap-2 mt-4 p-2 bg-muted rounded-md">
                <Gem className="h-5 w-5 text-green-500" />
                <span className="text-lg font-bold text-foreground">{user.gems ?? 0}</span>
                <span className="text-muted-foreground">Elmas</span>
              </div>
            </div>

            {/* Ünvan Seçimi */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-card-foreground text-xl font-outfit font-bold mb-4">Ünvan Seçimi</h3>
              <RadioGroup 
                onValueChange={handleTitleChange} 
                value={user.selected_title || 'none'}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-md border border-border">
                  <RadioGroupItem value="none" id="title-none" />
                  <Label htmlFor="title-none" className="flex items-center gap-2 text-muted-foreground">
                    <X className="h-4 w-4" />
                    Ünvan Yok (Kaldır)
                  </Label>
                </div>
                {Object.entries(TITLES).map(([minLevel, title]) => {
                  const isAvailable = level >= parseInt(minLevel);
                  const Icon = title.icon;
                  return (
                    <div key={title.name} className={cn(
                      "flex items-center space-x-3 p-3 rounded-md border",
                      isAvailable ? "border-primary/50 bg-accent/20" : "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                    )}>
                      <RadioGroupItem 
                        value={title.name} 
                        id={`title-${title.name}`} 
                        disabled={!isAvailable}
                      />
                      <Label htmlFor={`title-${title.name}`} className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4 text-yellow-400" />
                        {title.name}
                        {!isAvailable && (
                          <span className="text-xs text-red-400 ml-2">
                            (Seviye {minLevel} Gerekli)
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Çerçeve Seçimi */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="text-card-foreground text-xl font-outfit font-bold mb-4">Çerçeve Seçimi</h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Çerçeveyi Kaldır butonu */}
                <div className="flex flex-col items-center text-center">
                  <button
                    onClick={() => handleFrameSelect('none')}
                    className={cn(
                      "w-full h-20 flex items-center justify-center rounded-full border-4 border-dashed transition-all",
                      user.selected_frame === null ? "border-primary/80 bg-accent/20" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <X className="h-8 w-8 text-muted-foreground" />
                  </button>
                  <p className="text-xs mt-2 text-muted-foreground">Yok</p>
                </div>

                {FRAMES.map((frame) => {
                  const isOwned = ownedFrames.includes(frame.name);
                  const isSelected = user.selected_frame === frame.name;
                  
                  return (
                    <div key={frame.name} className="flex flex-col items-center text-center">
                      <button
                        onClick={() => handleFrameSelect(frame.name)}
                        disabled={!isOwned}
                        className={cn(
                          "w-full h-20 flex items-center justify-center rounded-full transition-all relative",
                          !isOwned && "opacity-50 cursor-not-allowed",
                          isSelected && "ring-4 ring-primary/50 ring-offset-2 ring-offset-background"
                        )}
                      >
                        {frame.name === 'Nova' ? (
                          <NovaFrame>
                            <AvatarPreview sizeClass="h-16 w-16" />
                          </NovaFrame>
                        ) : (
                          <div className={cn("p-1", frame.className)}>
                            <AvatarPreview sizeClass="h-16 w-16" />
                          </div>
                        )}
                        {!isOwned && (
                          <Lock className="absolute h-6 w-6 text-background bg-foreground/70 rounded-full p-1" />
                        )}
                      </button>
                      <p className="text-xs mt-2 text-foreground line-clamp-1">{frame.name}</p>
                      {!isOwned && <p className="text-xs text-red-400">Kilitli</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rozetler */}
            <div className="bg-card border border-border rounded-lg p-8">
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
                      <div
                        className={cn(
                          "flex items-center justify-center bg-card p-3 rounded-full border border-border shrink-0",
                          !hasBadge && "opacity-30 grayscale"
                        )}
                      >
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
            </div>

            {/* Hesap Ayarları */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-4">
              <h3 className="text-card-foreground text-xl font-outfit font-bold mb-4">Hesap Ayarları</h3>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowDeleteAvatarDialog(true)}
                disabled={!user.avatar_url}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Profil Fotoğrafını Sil
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowDeleteAccountDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hesabımı Kalıcı Olarak Sil
              </Button>
            </div>
          </div>

          {/* Sağ Sütun: Blog Yazıları */}
          <div className="lg:col-span-2">
            <h2 className="text-foreground text-2xl font-outfit font-bold mb-4">Blog Yazılarım ({userPosts.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CreateBlogCard />
              {postsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                    <div className="h-40 w-full bg-muted rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-4 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : (
                userPosts.map(post => (
                  <BlogCard 
                    key={post.id} 
                    post={post} 
                    showDelete={true} 
                    onDelete={handleDeleteRequest}
                    hideProfileLink={true}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {user.avatar_url && (
        <ImageViewerDialog
          open={isViewerOpen}
          onOpenChange={setIsViewerOpen}
          imageUrl={user.avatar_url}
          imageAlt={user.name || "Profil Fotoğrafı"}
        />
      )}

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

      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blog Yazısını Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Blog yazınız kalıcı olarak silinecektir.
              <span className="font-bold text-destructive"> Ayrıca, bu gönderiden kazandığınız 25 EXP'yi kaybedeceksiniz.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAvatarDialog} onOpenChange={setShowDeleteAvatarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profil Fotoğrafını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Mevcut profil fotoğrafınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAvatar}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAvatar} disabled={isDeletingAvatar} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeletingAvatar ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabınızı Kalıcı Olarak Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Hesabınız, tüm blog yazılarınız ve yorumlarınız kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeletingAccount ? "Siliniyor..." : "Hesabımı Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}