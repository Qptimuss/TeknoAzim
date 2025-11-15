import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getBlogPostById, getCommentsForPost } from "@/lib/blog-store";
import { ArrowLeft } from "lucide-react";
import { BlogPostWithAuthor, CommentWithAuthor } from "@shared/api";
import LikeDislikeButtons from "@/components/LikeDislikeButtons";
import CommentSection from "@/components/CommentSection";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostWithAuthor | null>(null);
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

  return (
    <div className="container mx-auto px-5 py-12 max-w-4xl">
      <Link to="/bloglar" className="text-white hover:underline flex items-center gap-2 mb-8">
        <ArrowLeft size={20} />
        Tüm Bloglara Geri Dön
      </Link>
      
      <article className="bg-[#090a0c] border border-[#2a2d31] rounded-lg overflow-hidden">
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        )}
        <div className="p-8">
          <h1 className="text-white text-3xl md:text-5xl font-outfit font-bold mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-4">
              <span>{post.profiles?.name || "Anonim"}</span>
              <span>&bull;</span>
              <span>{formattedDate}</span>
            </div>
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