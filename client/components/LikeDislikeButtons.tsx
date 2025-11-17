import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { getVoteCounts, getUserVote, castVote } from "@/lib/blog-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LikeDislikeButtonsProps {
  postId: string;
}

export default function LikeDislikeButtons({ postId }: LikeDislikeButtonsProps) {
  const { user } = useAuth();
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

    let newUserAction: 'liked' | 'disliked' | null = null;

    if (action === 'like') {
      if (userAction === 'liked') {
        // Unlike
        setLikes(l => l - 1);
        newUserAction = null;
      } else {
        // Like
        setLikes(l => l + 1);
        if (userAction === 'disliked') setDislikes(d => d - 1);
        newUserAction = 'liked';
      }
    } else { // dislike
      if (userAction === 'disliked') {
        // Undislike
        setDislikes(d => d - 1);
        newUserAction = null;
      } else {
        // Dislike
        setDislikes(d => d + 1);
        if (userAction === 'liked') setLikes(l => l - 1);
        newUserAction = 'disliked';
      }
    }
    
    setUserAction(newUserAction);
    
    try {
      // Map internal state ('liked'/'disliked') to API type ('like'/'dislike')
      const apiVoteType = newUserAction === 'liked' ? 'like' : newUserAction === 'disliked' ? 'dislike' : null;
      await castVote(postId, user.id, apiVoteType);
    } catch (error) {
      toast.error("Oy verilirken bir hata oluştu.");
      // Revert optimistic update on error
      fetchVotes();
    }
  };

  if (isLoading) {
    return <div className="flex items-center gap-4 h-8 w-24"><div className="h-4 bg-muted rounded w-full animate-pulse"></div></div>;
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleVote('like')} 
        disabled={!user}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-white",
          userAction === 'liked' && "text-blue-500 hover:text-blue-400"
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        <span>{likes}</span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleVote('dislike')} 
        disabled={!user}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-white",
          userAction === 'disliked' && "text-red-500 hover:text-red-400"
        )}
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
}