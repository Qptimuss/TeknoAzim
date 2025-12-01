import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getVoteCounts, getUserVote, castVote } from "@/lib/blog-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { awardBadge } from "@/lib/gamification";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  postId: string;
}

export default function LikeDislikeButtons({ postId }: Props) {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: voteCounts, isLoading: isCountsLoading } = useQuery({
    queryKey: ['voteCounts', postId],
    queryFn: () => getVoteCounts(postId),
    // Veri gelene kadar 0 göstermek için başlangıç verisi
    initialData: { likes: 0, dislikes: 0 },
  });

  const { data: userVote, isLoading: isUserVoteLoading } = useQuery({
    queryKey: ['userVote', postId, user?.id],
    queryFn: () => getUserVote(postId, user!.id),
    // Sadece kullanıcı giriş yapmışsa bu sorguyu çalıştır
    enabled: !!user,
  });

  const voteMutation = useMutation({
    mutationFn: (voteType: 'like' | 'dislike' | null) => castVote(postId, user!.id, voteType),
    onMutate: async (newVoteType) => {
      // İyimser güncelleme için mevcut sorguları iptal et
      await queryClient.cancelQueries({ queryKey: ['voteCounts', postId] });
      await queryClient.cancelQueries({ queryKey: ['userVote', postId, user?.id] });

      // Önceki verileri sakla
      const previousVoteCounts = queryClient.getQueryData<{ likes: number; dislikes: number }>(['voteCounts', postId]);
      const previousUserVote = queryClient.getQueryData<'liked' | 'disliked' | null>(['userVote', postId, user?.id]);

      // Kullanıcının oyunu anında güncelle
      queryClient.setQueryData(['userVote', postId, user?.id], newVoteType);

      // Sayıları anında güncelle
      queryClient.setQueryData(['voteCounts', postId], (old: { likes: number; dislikes: number } | undefined) => {
        if (!old) return { likes: 0, dislikes: 0 };
        let { likes, dislikes } = old;

        // Önceki oyu geri al
        if (previousUserVote === 'liked') likes--;
        if (previousUserVote === 'disliked') dislikes--;

        // Yeni oyu uygula
        if (newVoteType === 'like') likes++;
        if (newVoteType === 'dislike') dislikes++;
        
        return { likes, dislikes };
      });

      return { previousVoteCounts, previousUserVote };
    },
    onError: (err, newVote, context) => {
      // Hata durumunda eski verilere geri dön
      queryClient.setQueryData(['voteCounts', postId], context?.previousVoteCounts);
      queryClient.setQueryData(['userVote', postId, user?.id], context?.previousUserVote);
      toast.error("Oy verilirken bir hata oluştu.");
    },
    onSuccess: async (data, newVoteType) => {
        // Beğenme başarılı olursa rozet kontrolü yap
        if (newVoteType === 'like') {
            try {
                const { likes: newLikes } = await getVoteCounts(postId);
                const { data: post } = await supabase.from('blog_posts').select('user_id').eq('id', postId).single();

                if (post && post.user_id) {
                    let profileAfterUpdate = null;
                    if (newLikes === 2) profileAfterUpdate = await awardBadge(post.user_id, "Beğeni Başlangıcı");
                    if (newLikes === 5) profileAfterUpdate = await awardBadge(post.user_id, "Beğeni Mıknatısı");
                    if (newLikes === 10) profileAfterUpdate = await awardBadge(post.user_id, "Popüler Yazar");
                    
                    if (profileAfterUpdate && post.user_id === user?.id) {
                        updateUser(profileAfterUpdate);
                    }
                }
            } catch (error) {
                console.error("Error awarding badge after vote:", error);
            }
        }
    },
    onSettled: () => {
      // Her durumda sunucudan en güncel veriyi çek
      queryClient.invalidateQueries({ queryKey: ['voteCounts', postId] });
      queryClient.invalidateQueries({ queryKey: ['userVote', postId, user?.id] });
    },
  });

  const handleVote = (action: 'like' | 'dislike') => {
    if (!user) {
      toast.error("Oy vermek için giriş yapmalısınız.");
      return;
    }

    let newVoteType: 'like' | 'dislike' | null = null;
    if (action === 'like') {
      newVoteType = userVote === 'liked' ? null : 'like';
    } else { // dislike
      newVoteType = userVote === 'disliked' ? null : 'dislike';
    }
    
    voteMutation.mutate(newVoteType);
  };

  if (isCountsLoading || (!!user && isUserVoteLoading)) {
    return <div className="h-8 w-24 animate-pulse bg-muted rounded" />;
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
          userVote === 'liked' && "text-blue-500 hover:text-blue-400"
        )}
      >
        <ThumbsUp className="w-4 h-4" /> {voteCounts?.likes ?? 0}
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleVote('dislike')} 
        disabled={!user || voteMutation.isPending}
        className={cn(
          "flex items-center gap-2 text-muted-foreground hover:text-foreground",
          userVote === 'disliked' && "text-red-500 hover:text-red-400"
        )}
      >
        <ThumbsDown className="w-4 h-4" /> {voteCounts?.dislikes ?? 0}
      </Button>
    </div>
  );
}