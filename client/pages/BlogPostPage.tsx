import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBlogPostById } from "@/lib/blog-store";
import { ArrowLeft } from "lucide-react";
import { BlogPost } from "@shared/api";
import LikeDislikeButtons from "@/components/LikeDislikeButtons";
import CommentSection from "@/components/CommentSection";

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);

  useEffect(() => {
    if (id) {
      setPost(getBlogPostById(id));
    }
  }, [id]);

  const handleCommentAdded = () => {
    if (id) {
      // Yorum eklendikten sonra en son veriyi almak için post durumunu güncelle
      setPost(getBlogPostById(id));
    }
  };

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

  const formattedDate = new Date(post.date).toLocaleDateString("tr-TR", {
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
        {post.imageUrl && (
          <img
            src={post.imageUrl}
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
              <span>{post.author}</span>
              <span>&bull;</span>
              <span>{formattedDate}</span>
            </div>
            <LikeDislikeButtons postId={post.id} initialLikes={post.likes} initialDislikes={post.dislikes} />
          </div>
          <div className="text-[#eeeeee] text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </article>

      <CommentSection postId={post.id} comments={post.comments} onCommentAdded={handleCommentAdded} />
    </div>
  );
}