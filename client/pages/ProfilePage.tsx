import { useQuery } from "@tanstack/react-query";
import { getPostsByUserId } from "@/lib/blog-store";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BlogCard from "@/components/BlogCard";
import ProfileHeader from "@/components/ProfileHeader";
import ProfileHeaderSkeleton from "@/components/skeletons/ProfileHeaderSkeleton";
import BlogPostCardSkeleton from "@/components/skeletons/BlogPostCardSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function ProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth();

  // The profile data is already available in the useAuth hook as `user`.
  const profile = currentUser;

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["userPosts", currentUser?.id],
    queryFn: () => getPostsByUserId(currentUser!.id),
    enabled: !!currentUser,
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProfileHeaderSkeleton />
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground font-outfit">
            Gönderilerim
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => <BlogPostCardSkeleton key={index} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    // This case should be handled by ProtectedRoute, but as a fallback:
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Hata!</AlertTitle>
          <AlertDescription>
            Profil bilgileri yüklenemedi. Lütfen tekrar giriş yapmayı deneyin.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link to="/giris">Giriş Yap</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileHeader profile={profile} isOwnProfile={true} postCount={posts?.length ?? 0} />

      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6 text-foreground font-outfit">
          Gönderilerim
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoadingPosts
            ? Array.from({ length: 3 }).map((_, index) => <BlogPostCardSkeleton key={index} />)
            : posts?.map((post) => <BlogCard key={post.id} post={post} />)}
        </div>
        {!isLoadingPosts && posts?.length === 0 && (
          <div className="text-center py-16 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Henüz hiç gönderi paylaşmadınız.
            </p>
            <Button asChild className="mt-4">
              <Link to="/blog-olustur">İlk Gönderini Oluştur</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}