import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getVoteCounts, getUserVote, castVote } from "@/lib/blog-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface VoteCounts {
  likes: number;
  dislikes: number;
}

type VoteAction = 'liked' | 'disliked' | null;

interface Props {
  postId: string;
}

export default function LikeDislikeButtons({ postId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: voteCounts, isLoading: countsLoading } = useQuery<VoteCounts>(
    ['postVotes', postId],
    () => getVoteCounts(postId),
    { staleTime: 60000 }
  );

  const { data: userVote, isLoading: userVoteLoading } = useQuery<VoteAction>(
    ['userVote', postId, user?.id],
    () => user ? getUserVote(postId, user.id) : null,
    { enabled: !!user, staleTime: Infinity }
  );

  const mutation = useMutation(
    (voteType: 'like' | 'dislike' | null) => castVote(postId, user!.id, voteType),
    {
      onMutate: async (voteType) => {
        if (!user) return;

        await queryClient.cancelQueries(['postVotes', postId]);
        await queryClient.cancelQueries(['userVote', postId, user.id]);

        const previousCounts = queryClient.getQueryData<VoteCounts>(['postVotes', postId]);
        const previousUserVote = queryClient.getQueryData<VoteAction>(['userVote', postId, user.id]);

        let newLikes = previousCounts?.likes ?? 0;
        let newDislikes = previousCounts?.dislikes ?? 0;
        let newUserVote: VoteAction = voteType === 'like' ? 'liked' : voteType === 'dislike' ? 'disliked' : null;

        if (voteType === 'like' && previousUserVote === 'liked') {
          newLikes -= 1; newUserVote = null;
        }
        if (voteType === 'dislike' && previousUserVote === 'disliked') {
          newDislikes -= 1; newUserVote = null;
        }
        if (voteType === 'like' && previousUserVote === 'disliked') {
          newDislikes -= 1; newLikes += 1;
        }
        if (voteType === 'dislike' && previousUserVote === 'liked') {
          newLikes -= 1; newDislikes += 1;
        }

        queryClient.setQueryData(['postVotes', postId], { likes: newLikes, dislikes: newDislikes });
        queryClient.setQueryData(['userVote', postId, user.id], newUserVote);

        return { previousCounts, previousUserVote };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousCounts) queryClient.setQueryData(['postVotes', postId], context.previousCounts);
        if (context?.previousUserVote && user) queryClient.setQueryData(['userVote', postId, user.id], context.previousUserVote);
        toast.error("Oy verilirken bir hata oluştu.");
      },
      onSettled: () => {
        queryClient.invalidateQueries(['postVotes', postId]);
        if (user) queryClient.invalidateQueries(['userVote', postId, user.id]);
      },
    }
  );

  const handleVote = (action: 'like' | 'dislike') => {
    if (!user) { toast.error("Oy vermek için giriş yapmalısınız."); return; }
    let voteType: 'like' | 'dislike' | null = action;
    if ((action === 'like' && userVote === 'liked') || (action === 'dislike' && userVote === 'disliked')) voteType = null;
    mutation.mutate(voteType);
  };

  const likes = voteCounts?.likes ?? 0;
  const dislikes = voteCounts?.dislikes ?? 0;
  const isLoading = countsLoading || userVoteLoading || mutation.isLoading;

  if (isLoading) return <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />;

  return (
    <div className="flex gap-4 items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('like')}
        disabled={!user || mutation.isLoading}
        className={cn(userVote === 'liked' ? 'text-blue-500' : 'text-muted-foreground')}
      >
        <ThumbsUp className="w-4 h-4" /> {likes}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('dislike')}
        disabled={!user || mutation.isLoading}
        className={cn(userVote === 'disliked' ? 'text-red-500' : 'text-muted-foreground')}
      >
        <ThumbsDown className="w-4 h-4" /> {dislikes}
      </Button>
    </div>
  );
}
