import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { addComment, deleteComment } from "@/lib/blog-store";
import { CommentWithAuthor } from "@shared/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { awardBadge } from "@/lib/gamification";
import { supabase } from "@/integrations/supabase/client";
import ProfileAvatar from "./ProfileAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const commentSchema = z.object({
  content: z.string().min(3, "Yorum en az 3 karakter olmalıdır."),
});

interface CommentSectionProps {
  postId: string;
  comments: CommentWithAuthor[];
  onCommentAdded: () => void;
}

export default function CommentSection({ postId, comments, onCommentAdded: onCommentsChange }: CommentSectionProps) {
  const { user, updateUser } = useAuth();
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });

  async function onSubmit(values: z.infer<typeof commentSchema>) {
    if (!user) {
      toast.error("Yorum yapmak için giriş yapmalısınız.");
      return;
    }
    
    try {
      const { count, error: countError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countError) {
        console.error("Error checking comment count:", countError);
      }

      const isFirstComment = count === 0;

      await addComment({ postId, userId: user.id, content: values.content });
      
      let finalProfileState = null;

      if (isFirstComment) {
        const badgeUpdate = await awardBadge(user.id, "İlk Yorumcu");
        if (badgeUpdate) {
          finalProfileState = badgeUpdate;
        }
      }

      // Check for "Hızlı Parmaklar" badge
      const { count: firstCommentCount, error: firstCommentError } = await supabase
        .from('first_commenters')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (firstCommentError) {
        console.error("Error checking first comment count:", firstCommentError);
      } else if (firstCommentCount === 3) {
        const badgeUpdate = await awardBadge(user.id, "Hızlı Parmaklar");
        if (badgeUpdate) {
          finalProfileState = badgeUpdate;
        }
      }

      if (finalProfileState) {
        updateUser(finalProfileState);
      }

      toast.success("Yorumunuz eklendi!");
      form.reset();
      onCommentsChange();
    } catch (error) {
      toast.error("Yorum eklenirken bir hata oluştu.");
    }
  }

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment(commentToDelete);
      toast.success("Yorumunuz silindi.");
      onCommentsChange();
    } catch (error) {
      toast.error("Yorum silinirken bir hata oluştu.");
    } finally {
      setCommentToDelete(null);
    }
  };

  return (
    <div className="mt-12">
      <Separator className="bg-border mb-8" />
      <h2 className="text-foreground text-3xl font-outfit font-bold mb-6">Yorumlar ({comments.length})</h2>
      
      <div className="space-y-6 mb-8">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4 group">
              <div className="flex-1 bg-muted p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {comment.profiles ? (
                      <>
                        <Link to={`/kullanici/${comment.profiles.id}`} className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 border border-border transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5">
                          <ProfileAvatar profile={comment.profiles} className="h-6 w-6" />
                          <span className="font-semibold text-foreground">{comment.profiles?.name || "Anonim"}</span>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Seçenekler</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                              <Link to={`/kullanici/${comment.profiles.id}`}>Kullanıcının profiline bak</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 border border-border">
                        <ProfileAvatar profile={null} className="h-6 w-6" />
                        <p className="font-semibold text-foreground">Anonim</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString("tr-TR")}
                    </p>
                    {user && user.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500 transition-opacity"
                        onClick={() => setCommentToDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-foreground whitespace-pre-wrap pt-2">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
        )}
      </div>

      {user ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yorum Ekle</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Yorumunuzu buraya yazın..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Yorum Gönder
            </Button>
          </form>
        </Form>
      ) : (
        <p className="text-muted-foreground">Yorum yapmak için giriş yapmalısınız.</p>
      )}

      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yorumu Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Yorumunuz kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}