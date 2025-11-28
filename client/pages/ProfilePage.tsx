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
import { User as UserIcon, CheckCircle, Pencil, Check, X, Lock, Trash2, Loader2 } from "lucide-react";
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

  const AvatarPreview = ({ sizeClass = "h-20 w-20" }: { sizeClass?: string }) => (
    <Avatar className={sizeClass}>
      <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
      <AvatarFallback><UserIcon className="h-4/6 w-4/6" /></AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <div className="container mx-auto px-5 py-12">
        {/* UI kodu burada devam eder... */}
      </div>
      {imageToCrop && <ImageCropperDialog imageSrc={imageToCrop} open={isCropperOpen} onClose={() => { setIsCropperOpen(false); if (imageToCrop) URL.revokeObjectURL(imageToCrop); setImageToCrop(null); }} onCropComplete={handleCropComplete} />}
    </>
  );
}
