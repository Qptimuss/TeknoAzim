import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBlogPostById, getCommentsForPost, deleteBlogPost } from "@/lib/blog-store";
import { ArrowLeft, User as UserIcon, Edit, Trash2 } from "lucide-react";
import { BlogPostWithAuthor, CommentWithAuthor } from "@shared/api";
import LikeDislikeButtons from "@/components/LikeDislikeButtons";
import CommentSection from "@/components/CommentSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPostWithAuthor & { user_id?: string } | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPostAndComments = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [postData, commentsData] = await Promise.all([
      getBlogPostById(id),
      getCommentsForPost(id),
    ]);
    setPost(postData);
    setComments(commentsData);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  const handleDeletePost = async () => {
    if (!id) return;
    try {
      await deleteBlogPost(id);
      toast.success("Blog yazısı başarıyla silindi.");
      navigate("/bloglar");
    } catch (error) {
      toast.error("Blog yazısı silinirken bir hata oluştu.");
      console.error(error);
    }
  };

  if (loading) {
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
    return (
      <div className="container mx-auto px-5 py-12 text-center">
        <h1 className="text-white text-4xl font-bold mb-4">Blog Yazısı Bulunamadı</h1>
        <p className="text-[#eeeeee] mb-8">Aradığınız blog yazısı mevcut değil veya silinmiş olabilir.</p>
        <Link to="/bloglar" className="text-white hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={20} />
          Tüm Bloglara Geri Dön
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const isAuthor = user && user.id === post.user_id;

  return (
    <div className="container mx-auto px-5 py-12 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <Link to="/bloglar" className="text-white hover:underline flex items-center gap-2">
          <ArrowLeft size={20} />
          Tüm Bloglara Geri Dön
        </Link>
        {isAuthor && (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white">
              <Link to={`/bloglar/${post.id}/duzenle`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Düzenle
              </Link>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#090a0c] border-[#2a2d31] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Blog Yazısını Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#eeeeee]">
                    Bu işlem geri alınamaz. "{post.title}" başlıklı blog yazısı kalıcı olarak silinecektir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-[#42484c] hover:bg-[#151313]">İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700 text-white">
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      
      <article className="bg-[#090a0c] border border-[#2a2d31] rounded-lg overflow-hidden">
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        )}
        <div className="p-8">
          {post.profiles && (
            <Link to={`/kullanici/${post.profiles.id}`} className="inline-flex items-center gap-2 mb-4 w-fit rounded-full bg-[#151313] px-3 py-1 border border-[#42484c] transition-all duration-200 hover:border-[#6b7280] hover:-translate-y-0.5 hover:shadow-md hover:shadow-white/5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.profiles?.avatar_url || undefined} alt={post.profiles?.name || ''} />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{post.profiles?.name || "Anonim"}</span>
            </Link>
          )}
          <h1 className="text-white text-3xl md:text-5xl font-outfit font-bold mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground mb-6">
            <span>{formattedDate}</span>
            <LikeDislikeButtons postId={post.id} />
          </div>
          <div className="text-[#eeeeee] text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </article>

      <CommentSection postId={post.id} comments={comments} onCommentAdded={fetchPostAndComments} />
    </div>
  );
}