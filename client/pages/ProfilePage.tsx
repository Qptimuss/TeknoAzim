import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPostsByUserId } from "@/lib/blog-store";
import { getProfile } from "@/lib/profile-store";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BlogPostCard from "@/components/BlogPostCard";
import ProfileHeader from "@/components/ProfileHeader";
import ProfileHeaderSkeleton from "@/components/skeletons/ProfileHeaderSkeleton";
import BlogPostCardSkeleton from "@/components/skeletons/BlogPostCardSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === userId;

  const { data: profile, isLoading: isLoadingProfile, isError: isProfileError } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => getPostsByUserId(userId!),
    enabled: !!userId,
  });

  if (isProfileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Hata!</AlertTitle>
          <AlertDescription>
            Kullanıcı profili yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isLoadingProfile && !profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Kullanıcı Bulunamadı</h1>
        <p className="text-muted-foreground mb-6">Aradığınız kullanıcı mevcut değil veya silinmiş olabilir.</p>
        <Button asChild>
          <Link to="/">Ana Sayfaya Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoadingProfile ? (
        <ProfileHeaderSkeleton />
      ) : (
        profile && <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} postCount={posts?.length ?? 0} />
      )}

      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6 text-foreground font-outfit">
          {isOwnProfile ? "Gönderilerim" : `${profile?.name || 'Kullanıcının'}'in Gönderileri`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoadingPosts
            ? Array.from({ length: 3 }).map((_, index) => <BlogPostCardSkeleton key={index} />)
            : posts?.map((post) => <BlogPostCard key={post.id} post={post} />)}
        </div>
        {!isLoadingPosts && posts?.length === 0 && (
          <div className="text-center py-16 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              {isOwnProfile ? "Henüz hiç gönderi paylaşmadınız." : "Bu kullanıcının henüz hiç gönderisi yok."}
            </p>
            {isOwnProfile && (
              <Button asChild className="mt-4">
                <Link to="/yeni-gonderi">İlk Gönderini Oluştur</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}