import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBlogPostById, getCommentsForPost, deleteBlogPost } from "@/lib/blog-store";
import { ArrowLeft, User as UserIcon, Trash2, Pencil } from "lucide-react";
import { BlogPostWithAuthor, CommentWithAuthor } from "@shared/api";
import LikeDislikeButtons from "@/components/LikeDislikeButtons";
import CommentSection from "@/components/CommentSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
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
import { Separator } from "@/components/ui/separator";
import { removeExp, EXP_ACTIONS } from "@/lib/gamification";
import OtherPostsCarousel from "@/components/OtherPostsCarousel";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Import useQueryClient

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Initialize query client

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch Post Details
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ["blogPost", id],
    queryFn: () => (id ? getBlogPostById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Comments
  const { data: comments, isLoading: isCommentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ["postComments", id],
    queryFn: () => (id ? getCommentsForPost(id) : Promise.resolve([])),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Redirect if post is not found after loading
  useEffect(() => {
    if (!isPostLoading && !post && id) {
      toast.error("Blog yazısı bulunamadı.");
      navigate("/bloglar");
    }
  }, [isPostLoading, post, id, navigate]);

  const handleCommentAction = () => {
    // Yorum eklendiğinde/silindiğinde yorumları ve blog listesini yenile
    refetchComments();
    queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
  };

  const handleDelete = async () => {
    if (!post || !user || user.id !== post.profiles?.id) return;

    setIsDeleting(true);
    try {
      await deleteBlogPost(post.id, post.image_url);
      
      const updatedProfile = await removeExp(user.id, EXP_ACTIONS.CREATE_POST);
      if (updatedProfile) {
        updateUser(updatedProfile);
      }

      // Blog listesini ve post detayını geçersiz kıl
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
      queryClient.invalidateQueries({ queryKey: ["blogPost", post.id] });

      toast.success("Blog yazısı başarıyla silindi.");
      navigate("/bloglar");
    } catch (error) {
      toast.error("Blog yazısı silinirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isPostLoading) {
    return (
      <div className="container mx-auto px-5 py-12 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    // Redirect handled by useEffect, show nothing while waiting
    return null;
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isAuthor = user && post.profiles && user.id === post.profiles.id;

  return (
    <>
      <div className="container mx-auto px-5 py-12 max-w-4xl">
        <Link to="/bloglar" className="text-foreground hover:underline flex items-center gap-2 mb-8">
          <ArrowLeft size={20} />
          Tüm Bloglara Geri Dön
        </Link>
        
        <article className="bg-card border border-border rounded-lg overflow-hidden relative">
          {isAuthor && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button asChild variant="outline" size="icon">
                <Link to={`/bloglar/${post.id}/duzenle`}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Düzenle</span>
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Sil</span>
              </Button>
            </div>
          )}
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          )}
          <div className="p-8">
            {post.profiles && (
              <Link to={`/kullanici/${post.profiles.id}`} className="inline-flex items-center gap-2 mb-4 w-fit rounded-full bg-background px-3 py-1 border border-border transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.profiles?.avatar_url || undefined} alt={post.profiles?.name || ''} />
                  <AvatarFallback>
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{post.profiles?.name || "Anonim"}</span>
              </Link>
            )}
            <p className="text-sm text-muted-foreground mb-4">{formattedDate}</p>
            <h1 className="text-card-foreground text-3xl md:text-5xl font-outfit font-bold mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-muted-foreground mb-6">
              {/* LikeDislikeButtons'a post ID'sini gönderiyoruz */}
              <LikeDislikeButtons postId={post.id} />
            </div>
            <div className="text-card-foreground text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>

            {post.profiles && (
              <>
                <Separator className="my-8" />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Yazar:</h3>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted p-6 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={post.profiles.avatar_url || undefined} alt={post.profiles.name || ''} />
                        <AvatarFallback>
                          <UserIcon className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-lg text-foreground">{post.profiles.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{post.profiles.description}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline">
                      <Link to={`/kullanici/${post.profiles.id}`}>
                        Kullanıcının profiline erişmek için tıkla
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </article>

        {/* CommentSection'a yorumları ve yenileme fonksiyonunu gönderiyoruz */}
        <CommentSection 
          postId={post.id} 
          comments={comments || []} 
          onCommentAdded={handleCommentAction} 
        />
        
        <OtherPostsCarousel currentPostId={post.id} />
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}