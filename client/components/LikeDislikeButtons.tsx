import { useAuth } from "@/contexts/AuthContext";
import { castVote, getVoteCounts, getUserVote } from "@/lib/blog-store";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LikeDislikeButtonsProps {
  postId: string;
}

export default function LikeDislikeButtons({ postId }: LikeDislikeButtonsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Oy Sayılarını Çekme (Likes/Dislikes)
  const { data: voteCounts, isLoading: isCountsLoading } = useQuery({
    queryKey: ["postVotes", postId],
    queryFn: () => getVoteCounts(postId),
    staleTime: 1000 * 60, // 1 dakika taze kal
  });

  // 2. Kullanıcının Oyunu Çekme
  const { data: userAction, isLoading: isUserVoteLoading } = useQuery({
    queryKey: ["userVote", postId, user?.id],
    queryFn: () => (user ? getUserVote(postId, user.id) : Promise.resolve(null)),
    enabled: !!user, // Sadece kullanıcı varsa çalıştır
    staleTime: Infinity, // Kullanıcının oyu değişene kadar taze kalmalı
  });

  // 3. Oy Verme Mutasyonu
  const voteMutation = useMutation({
    mutationFn: ({ voteType }: { voteType: 'like' | 'dislike' | null }) => 
      castVote(postId, user!.id, voteType),
    
    onMutate: async ({ voteType }) => {
      if (!user) return;

      // Optimistic Update: Mevcut sorguları iptal et
      await queryClient.cancelQueries({ queryKey: ["postVotes", postId] });
      await queryClient.cancelQueries({ queryKey: ["userVote", postId, user.id] });

      // Snapshot al
      const previousCounts: { likes: number; dislikes: number } | undefined = queryClient.getQueryData(["postVotes", postId]);
      const previousUserAction: 'liked' | 'disliked' | null | undefined = queryClient.getQueryData(["userVote", postId, user.id]);

      // Yeni durumu hesapla
      let newLikes = previousCounts?.likes ?? 0;
      let newDislikes = previousCounts?.dislikes ?? 0;
      let newUserAction: 'liked' | 'disliked' | null = null;

      if (voteType === 'like') {
        if (previousUserAction === 'liked') {
          newLikes -= 1;
          newUserAction = null;
        } else {
          newLikes += 1;
          if (previousUserAction === 'disliked') newDislikes -= 1;
          newUserAction = 'liked';
        }
      } else if (voteType === 'dislike') {
        if (previousUserAction === 'disliked') {
          newDislikes -= 1;
          newUserAction = null;
        } else {
          newDislikes += 1;
          if (previousUserAction === 'liked') newLikes -= 1;
          newUserAction = 'disliked';
        }
      } else { // voteType === null
        if (previousUserAction === 'liked') newLikes -= 1;
        if (previousUserAction === 'disliked') newDislikes -= 1;
        newUserAction = null;
      }

      // Optimistic olarak cache'i güncelle
      queryClient.setQueryData(["postVotes", postId], { likes: newLikes, dislikes: newDislikes });
      queryClient.setQueryData(["userVote", postId, user.id], newUserAction);

      // Context'e geri dönmek için snapshot'ı döndür
      return { previousCounts, previousUserAction };
    },

    onError: (err, variables, context) => {
      // Hata durumunda eski duruma geri dön
      toast.error("Oy verilirken bir hata oluştu.");
      if (context?.previousCounts) {
        queryClient.setQueryData(["postVotes", postId], context.previousCounts);
      }
      if (context?.previousUserAction) {
        queryClient.setQueryData(["userVote", postId, user!.id], context.previousUserAction);
      }
    },

    onSettled: () => {
      // Sunucudan gelen veriyi doğrulamak için ilgili sorguları geçersiz kıl
      queryClient.invalidateQueries({ queryKey: ["postVotes", postId] });
      queryClient.invalidateQueries({ queryKey: ["userVote", postId, user?.id] });
      // Yazarın profilini de geçersiz kıl, çünkü bir rozet kazanmış olabilir.
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const handleVote = (action: 'like' | 'dislike') => {
    if (!user) {
      toast.error("Oy vermek için giriş yapmalısınız.");
      return;
    }

    let newVoteType: 'like' | 'dislike' | null = action;

    // Eğer aynı oyu tekrar veriyorsa, oyu kaldır
    if ((action === 'like' && userAction === 'liked') || (action === 'dislike' && userAction === 'disliked')) {
      newVoteType = null;
    }
    
    voteMutation.mutate({ voteType: newVoteType });
  };

  const likes = voteCounts?.likes ?? 0;
  const dislikes = voteCounts?.dislikes ?? 0;
  const isLoading = isCountsLoading || isUserVoteLoading || voteMutation.isPending;

  if (isLoading) {
    return <div className="flex items-center gap-4 h-8 w-24"><div className="h-4 bg-muted rounded w-full animate-pulse"></div></div>;
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleVote('like')} 
        disabled={!user || voteMutation.isPending}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-foreground",
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
        disabled={!user || voteMutation.isPending}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-foreground",
          userAction === 'disliked' && "text-red-500 hover:text-red-400"
        )}
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
}