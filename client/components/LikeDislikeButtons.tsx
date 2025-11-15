import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { likePost, dislikePost } from "@/lib/blog-store";

interface LikeDislikeButtonsProps {
  postId: string;
  initialLikes: number;
  initialDislikes: number;
}

export default function LikeDislikeButtons({ postId, initialLikes, initialDislikes }: LikeDislikeButtonsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);

  const handleLike = () => {
    likePost(postId);
    setLikes(prev => prev + 1);
  };

  const handleDislike = () => {
    dislikePost(postId);
    setDislikes(prev => prev + 1);
  };

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-2 text-muted-foreground hover:text-white">
        <ThumbsUp className="h-4 w-4" />
        <span>{likes}</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDislike} className="flex items-center gap-2 text-muted-foreground hover:text-white">
        <ThumbsDown className="h-4 w-4" />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
}