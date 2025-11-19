import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProfileById, getPostsByUserId } from "@/lib/blog-store";
import { BlogPostWithAuthor, Profile } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, ArrowLeft, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LEVEL_THRESHOLDS, getExpForNextLevel } from "@/lib/gamification";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<BlogPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      const [profileData, postsData] = await Promise.all([
        getProfileById(userId),
        getPostsByUserId(userId),
      ]);
      setProfile(profileData);
      setPosts(postsData);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto px-5 py-12">
        <div className="flex flex-col items-center mb-8">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[225px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-5 py-12 text-center">
        <h1 className="text-white text-4xl font-bold mb-4">Kullanıcı Bulunamadı</h1>
        <p className="text-[#eeeeee] mb-8">Aradığınız kullanıcı mevcut değil.</p>
        <Link to="/bloglar" className="text-white hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={20} />
          Bloglara Geri Dön
        </Link>
      </div>
    );
  }

  const currentLevelExp = LEVEL_THRESHOLDS[profile.level - 1] || 0;
  const nextLevelExp = getExpForNextLevel(profile.level);
  const expProgress = nextLevelExp === Infinity ? 100 : ((profile.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;

  return (
    <div className="container mx-auto px-5 py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
          <AvatarFallback>
            <UserIcon className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold">
          {profile.name}
        </h1>
        {profile.description && (
          <p className="text-muted-foreground mt-4 max-w-lg">{profile.description}</p>
        )}
        
        {/* Gamification Info */}
        <div className="mt-6 w-full max-w-sm bg-[#090a0c] border border-[#2a2d31] rounded-lg p-4">
          <h3 className="text-white text-lg font-outfit font-bold mb-3">Seviye {profile.level}</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full">
                <Progress value={expProgress} className="w-full" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{profile.exp} / {nextLevelExp} EXP</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {profile.badges && profile.badges.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {profile.badges.map(badge => (
                <TooltipProvider key={badge}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="bg-[#151313] p-2 rounded-full border border-[#42484c]">
                        <Star className="h-5 w-5 text-yellow-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{badge}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className="text-white text-2xl font-outfit font-bold mb-8">
        {profile.name}'in Blogları ({posts.length})
      </h2>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="bg-[#090a0c] border border-[#2a2d31] rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Bu kullanıcının henüz hiç blog yazısı yok.</p>
        </div>
      )}
    </div>
  );
}