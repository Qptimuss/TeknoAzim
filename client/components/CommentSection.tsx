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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Trash2 } from "lucide-react";
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
import { moderateContent } from "@/lib/moderate";
import { Link } from "react-router-dom";

const commentSchema = z.object({
  content: z.string().min(3, "Yorum en az 3 karakter olmalıdır."),
});

interface CommentSectionProps {
  postId: string;
  comments: CommentWithAuthor[];
  onCommentAdded: () => void;
}

export default function CommentSection({ postId, comments, onCommentAdded: onCommentsChange }: CommentSectionProps) {
  const { user } = useAuth();
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

    // Moderation check
    const isAppropriate = await moderateContent(values.content);
    if (!isAppropriate) {
      toast.error("Uygunsuz içerik tespit edildi.", {
        description: "Lütfen topluluk kurallarına uygun bir dil kullanın.",
      });
      return;
    }

    try {
      await addComment({ postId, userId: user.id, content: values.content });
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
      <Separator className="bg-[#2a2d31] mb-8" />
      <h2 className="text-white text-3xl font-outfit font-bold mb-6">Yorumlar ({comments.length})</h2>
      
      <div className="space-y-6 mb-8">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4 group">
              <div className="flex-1 bg-[#151313]/50 p-4 rounded-lg border border-[#2a2d31]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {comment.profiles ? (
                      <Link to={`/kullanici/${comment.profiles.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#151313] px-3 py-1 border border-[#42484c] transition-all duration-200 hover:border-[#6b7280] hover:-translate-y-0.5 hover:shadow-md hover:shadow-white/5">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                          <AvatarFallback>{comment.profiles?.name?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-white">{comment.profiles?.name || "Anonim"}</span>
                      </Link>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#151313] px-3 py-1 border border-[#42484c]">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{'A'}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-white">Anonim</p>
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
                <p className="text-[#eeeeee] whitespace-pre-wrap pt-2">{comment.content}</p>
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
                  <FormLabel className="text-white">Yorum Ekle</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Yorumunuzu buraya yazın..." {...field} className="bg-[#151313] border-[#42484c] text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="bg-[#151313]/95 border border-[#42484c] text-white transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/10">
              Yorum Gönder
            </Button>
          </form>
        </Form>
      ) : (
        <p className="text-muted-foreground">Yorum yapmak için giriş yapmalısınız.</p>
      )}

      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent className="bg-[#090a0c] border-[#2a2d31] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Yorumu Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#eeeeee]">
              Bu işlem geri alınamaz. Yorumunuz kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#42484c] hover:bg-[#151313]">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}