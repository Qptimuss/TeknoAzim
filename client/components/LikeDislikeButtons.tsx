import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { 
  incrementLike, 
  decrementLike, 
  incrementDislike, 
  decrementDislike 
} from "@/lib/blog-store";
import { cn } from "@/lib/utils";

interface LikeDislikeButtonsProps {
  postId: string;
  initialLikes: number;
  initialDislikes: number;
}

export default function LikeDislikeButtons({ postId, initialLikes, initialDislikes }: LikeDislikeButtonsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userAction, setUserAction] = useState<'liked' | 'disliked' | null>(null);

  const handleLike = () => {
    if (userAction === 'liked') {
      // Kullanıcı beğeniyi geri alıyor
      decrementLike(postId);
      setLikes(prev => prev - 1);
      setUserAction(null);
    } else if (userAction === 'disliked') {
      // Kullanıcı beğenmemekten beğenmeye geçiyor
      incrementLike(postId);
      decrementDislike(postId);
      setLikes(prev => prev + 1);
      setDislikes(prev => prev - 1);
      setUserAction('liked');
    } else {
      // Kullanıcı ilk kez beğeniyor
      incrementLike(postId);
      setLikes(prev => prev + 1);
      setUserAction('liked');
    }
  };

  const handleDislike = () => {
    if (userAction === 'disliked') {
      // Kullanıcı beğenmemeyi geri alıyor
      decrementDislike(postId);
      setDislikes(prev => prev - 1);
      setUserAction(null);
    } else if (userAction === 'liked') {
      // Kullanıcı beğenmekten beğenmemeye geçiyor
      decrementLike(postId);
      incrementDislike(postId);
      setLikes(prev => prev - 1);
      setDislikes(prev => prev + 1);
      setUserAction('disliked');
    } else {
      // Kullanıcı ilk kez beğenmiyor
      incrementDislike(postId);
      setDislikes(prev => prev + 1);
      setUserAction('disliked');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLike} 
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
        onClick={handleDislike} 
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