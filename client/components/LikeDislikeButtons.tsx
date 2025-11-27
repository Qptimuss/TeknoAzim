import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { getVoteCounts, getUserVote, castVote } from "@/lib/blog-store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { awardBadge } from "@/lib/gamification";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LikeDislikeButtonsProps {
  postId: string;
}

export default function LikeDislikeButtons({ postId }: LikeDislikeButtonsProps) {
  const { user, updateUser } = useAuth();
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
      const previousCounts = queryClient.getQueryData(["postVotes", postId]);
      const previousUserAction = queryClient.getQueryData(["userVote", postId, user.id]);

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

    onSettled: (data, error, variables) => {
      // Başarılı veya hatalı olsun, sunucudan gelen veriyi doğrulamak için yenile
      queryClient.invalidateQueries({ queryKey: ["postVotes", postId] });
      queryClient.invalidateQueries({ queryKey: ["userVote", postId, user!.id] });
      
      // Rozet kontrolü (Sadece like atıldığında ve like sayısı arttığında)
      if (variables.voteType === 'like' && user) {
        checkBadges(user.id);
      }
    },
  });

  const checkBadges = useCallback(async (currentUserId: string) => {
    // Bu fonksiyonu sadece başarılı bir like işleminden sonra çağırıyoruz.
    try {
      const { likes: newLikes } = await getVoteCounts(postId);
      
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (postError || !post || !post.user_id) {
        console.error("Error fetching post author for badge:", postError);
        return;
      }

      const postAuthorId = post.user_id;
      let profileAfterUpdate = null;

      // YENİ ROZET KONTROLÜ: 2, 5, 10 beğeni
      if (newLikes === 2) {
        const badgeUpdate = await awardBadge(postAuthorId, "Beğeni Başlangıcı");
        if (badgeUpdate) profileAfterUpdate = badgeUpdate;
      } else if (newLikes === 5) {
        const badgeUpdate = await awardBadge(postAuthorId, "Beğeni Mıknatısı");
        if (badgeUpdate) profileAfterUpdate = badgeUpdate;
      } else if (newLikes === 10) {
        const badgeUpdate = await awardBadge(postAuthorId, "Popüler Yazar");
        if (badgeUpdate) profileAfterUpdate = badgeUpdate;
      }

      // If the badge earner is the current user, update context
      if (profileAfterUpdate && postAuthorId === currentUserId) {
        updateUser(profileAfterUpdate);
      }
    } catch (error) {
      console.error("Badge check failed:", error);
    }
  }, [postId, updateUser]);


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