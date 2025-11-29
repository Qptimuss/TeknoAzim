import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProfileById, getPostsByUserId } from "@/lib/blog-store";
import { Profile, BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, CheckCircle, Lock, Trash2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateLevel, ALL_BADGES, TITLES } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { FRAMES } from "@/lib/store-items";
import NovaFrame from "@/components/frames/NovaFrame";
import ImageViewerDialog from "@/components/ImageViewerDialog";
import { useAuth } from "@/contexts/AuthContext"; // useAuth hook'u import edildi
import { isAdmin } from "@/lib/auth-utils"; // isAdmin helper'ı import edildi
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api-utils"; // fetchWithAuth import edildi
import { useNavigate } from "react-router-dom";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userPosts, setUserPosts] = useState<BlogPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { user: currentUser, logout } = useAuth(); // Mevcut giriş yapmış kullanıcı
  const isUserAdmin = isAdmin(currentUser); // Mevcut kullanıcının admin olup olmadığı
  const navigate = useNavigate();

  // Hesap silme state'leri
  const [showAdminDeleteUserDialog, setShowAdminDeleteUserDialog] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      const profile = await getProfileById(userId);
      setUserProfile(profile);
      setLoading(false);
    };

    const fetchUserPosts = async () => {
      setPostsLoading(true);
      const posts = await getPostsByUserId(userId);
      setUserPosts(posts);
      setPostsLoading(false);
    };

    fetchData();
    fetchUserPosts();
  }, [userId]);

  const handleAdminDeleteUserAccount = async () => {
    if (!userId || !currentUser || !isUserAdmin) return;

    setIsDeletingUser(true);
    try {
      await fetchWithAuth(`/api/admin/user/${userId}`, {
        method: 'DELETE',
      });

      toast.success("Kullanıcı hesabı başarıyla silindi.");
      navigate("/bloglar"); // Kullanıcı silindikten sonra ana sayfaya veya bloglara yönlendir
    } catch (error) {
      toast.error("Kullanıcı hesabı silinirken bir hata oluştu.", {
        description: error instanceof Error ? error.message : "Lütfen tekrar deneyin.",
      });
    } finally {
      setIsDeletingUser(false);
      setShowAdminDeleteUserDialog(false);
    }
  };

  if (loading) {
    return <div className="text-foreground text-center p-12">Profil yükleniyor...</div>;
  }

  if (!userProfile) {
    return <div className="text-foreground text-center p-12">Kullanıcı bulunamadı.</div>;
  }

  const { level, expForNextLevel, currentLevelExp } = calculateLevel(userProfile.exp || 0);
  const expInCurrentLevel = (userProfile.exp || 0) - currentLevelExp;
  const expProgress = expForNextLevel === 0 ? 100 : (expInCurrentLevel / expForNextLevel) * 100;

  const selectedTitleObject = Object.values(TITLES).find(t => t.name === userProfile.selected_title);
  const SelectedTitleIcon = selectedTitleObject ? selectedTitleObject.icon : CheckCircle;
  const selectedFrame = FRAMES.find(f => f.name === userProfile.selected_frame);

  // Adminin kendi profilini bu sayfadan silmesini engelle
  const canAdminDeleteThisUser = isUserAdmin && currentUser?.id !== userId;

  return (
    <>
      <div className="container mx-auto px-5 py-12">
        <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold mb-8">
          {userProfile.name} Profili
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex flex-col items-center mb-6 text-center">
                <button
                  onClick={() => userProfile.avatar_url && setIsViewerOpen(true)}
                  disabled={!userProfile.avatar_url}
                  className="disabled:cursor-default mb-4"
                >
                  {userProfile.selected_frame === 'Nova' ? (
                    <NovaFrame>
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.name || ''} />
                        <AvatarFallback>
                          <UserIcon className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </NovaFrame>
                  ) : (
                    <div className={cn("p-1", selectedFrame?.className)}>
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.name || ''} />
                        <AvatarFallback>
                          <UserIcon className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </button>
                <h2 className="text-card-foreground text-2xl font-outfit font-bold">{userProfile.name}</h2>
                {userProfile.selected_title && (
                  <p className="text-yellow-400 font-semibold text-sm mt-1 flex items-center gap-1">
                    <SelectedTitleIcon className="h-4 w-4" /> {userProfile.selected_title}
                  </p>
                )}
                <p className="text-muted-foreground mt-2">{userProfile.description}</p>
              </div>

              <div className="mb-6 border-t border-border pt-6">
                <h3 className="text-card-foreground text-xl font-outfit font-bold mb-4 text-center">Seviye {level}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="w-full">
                      <Progress value={expProgress} className="w-full" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toplam Deneyim: {userProfile.exp || 0} EXP</p>
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
                    {userProfile.badges?.length || 0} / {ALL_BADGES.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 bg-background rounded-lg border border-border">
                  {ALL_BADGES.map((badge) => {
                    const hasBadge = userProfile.badges?.includes(badge.name);
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
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Bir blog oluşturmak 25 EXP, bir rozet kazanmak 50 EXP verir.
                </p>
              </div>

              {canAdminDeleteThisUser && ( // Admin ve kendi profili değilse göster
                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="text-destructive text-xl font-outfit font-bold mb-4">Admin Araçları</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bu kullanıcının hesabını silmek kalıcı bir eylemdir ve geri alınamaz.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={() => setShowAdminDeleteUserDialog(true)}
                  >
                    Kullanıcının Hesabını Sil
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-foreground text-2xl font-outfit font-bold mb-4">{userProfile.name} Blogları ({userPosts.length})</h2>
            {postsLoading ? (
               <p className="text-muted-foreground">Bloglar yükleniyor...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {userPosts.map(post => (
                  <BlogCard key={post.id} post={post} hideProfileLink={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {userProfile.avatar_url && (
        <ImageViewerDialog
          open={isViewerOpen}
          onOpenChange={setIsViewerOpen}
          imageUrl={userProfile.avatar_url}
          imageAlt={userProfile.name || "Profil Fotoğrafı"}
        />
      )}

      <AlertDialog open={showAdminDeleteUserDialog} onOpenChange={setShowAdminDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcının Hesabını Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. <span className="font-bold text-foreground">{userProfile.name}</span> kullanıcısının tüm blog yazıları, yorumları ve profil verileri kalıcı olarak silinecektir. Bu işlemi onaylıyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminDeleteUserAccount}
              disabled={isDeletingUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingUser ? "Siliniyor..." : "Evet, Hesabı Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}