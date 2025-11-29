import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getVoteCounts, getUserVote, castVote } from "@/lib/blog-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { awardBadge } from "@/lib/gamification";
import { useState, useEffect, useCallback } from "react";

interface Props {
  postId: string;
}

export default function LikeDislikeButtons({ postId }: Props) {
  const { user, updateUser } = useAuth();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userAction, setUserAction] = useState<'liked' | 'disliked' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    const counts = await getVoteCounts(postId);
    setLikes(counts.likes);
    setDislikes(counts.dislikes);
    if (user) {
      const vote = await getUserVote(postId, user.id);
      setUserAction(vote);
    }
    setIsLoading(false);
  }, [postId, user]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const handleVote = async (action: 'like' | 'dislike') => {
    if (!user) {
      toast.error("Oy vermek için giriş yapmalısınız.");
      return;
    }

    const isLiking = action === 'like' && userAction !== 'liked';
    let newUserAction: 'liked' | 'disliked' | null = null;

    if (action === 'like') {
      if (userAction === 'liked') {
        setLikes(l => l - 1);
        newUserAction = null;
      } else {
        setLikes(l => l + 1);
        if (userAction === 'disliked') setDislikes(d => d - 1);
        newUserAction = 'liked';
      }
    } else {
      if (userAction === 'disliked') {
        setDislikes(d => d - 1);
        newUserAction = null;
      } else {
        setDislikes(d => d + 1);
        if (userAction === 'liked') setLikes(l => l - 1);
        newUserAction = 'disliked';
      }
    }
    
    setUserAction(newUserAction);

    try {
      const apiVoteType = newUserAction === 'liked' ? 'like' : newUserAction === 'disliked' ? 'dislike' : null;
      await castVote(postId, user.id, apiVoteType);

      if (isLiking) {
        const { likes: newLikes } = await getVoteCounts(postId);

        const { data: post, error: postError } = await supabase
          .from('blog_posts')
          .select('user_id')
          .eq('id', postId)
          .single();

        if (postError) {
          console.error("Error fetching post author for badge:", postError);
          return;
        }

        if (post && post.user_id) {
          let profileAfterUpdate = null;

          if (newLikes === 2) {
            const badgeUpdate = await awardBadge(post.user_id, "Beğeni Başlangıcı");
            if (badgeUpdate) profileAfterUpdate = badgeUpdate;
          }

          if (newLikes === 5) {
            const badgeUpdate = await awardBadge(post.user_id, "Beğeni Mıknatısı");
            if (badgeUpdate) profileAfterUpdate = badgeUpdate;
          }

          if (newLikes === 10) {
            const badgeUpdate = await awardBadge(post.user_id, "Popüler Yazar");
            if (badgeUpdate) profileAfterUpdate = badgeUpdate;
          }

          if (profileAfterUpdate && post.user_id === user.id) {
            updateUser(profileAfterUpdate);
          }
        }
      }
    } catch (error) {
      toast.error("Oy verilirken bir hata oluştu.");
      fetchVotes();
    }
  };

  if (isLoading) return <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />;

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleVote('like')} 
        disabled={!user}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-foreground",
          userAction === 'liked' && "text-blue-500 hover:text-blue-400"
        )}
      >
        <ThumbsUp className="w-4 h-4" /> {likes}
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleVote('dislike')} 
        disabled={!user}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-foreground",
          userAction === 'disliked' && "text-red-500 hover:text-red-400"
        )}
      >
        <ThumbsDown className="w-4 h-4" /> {dislikes}
      </Button>
    </div>
  );
}
