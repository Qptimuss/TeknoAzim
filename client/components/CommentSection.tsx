import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { addComment } from "@/lib/blog-store";
import { CommentWithAuthor } from "@shared/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const commentSchema = z.object({
  content: z.string().min(3, "Yorum en az 3 karakter olmalıdır."),
});

interface CommentSectionProps {
  postId: string;
  comments: CommentWithAuthor[];
  onCommentAdded: () => void;
}

export default function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const { user } = useAuth();
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
      await addComment({ postId, userId: user.id, content: values.content });
      toast.success("Yorumunuz eklendi!");
      form.reset();
      onCommentAdded();
    } catch (error) {
      toast.error("Yorum eklenirken bir hata oluştu.");
    }
  }

  return (
    <div className="mt-12">
      <Separator className="bg-[#2a2d31] mb-8" />
      <h2 className="text-white text-3xl font-outfit font-bold mb-6">Yorumlar ({comments.length})</h2>
      
      <div className="space-y-6 mb-8">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                <AvatarFallback>{comment.profiles?.name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-[#151313]/50 p-4 rounded-lg border border-[#2a2d31]">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white">{comment.profiles?.name || "Anonim"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>
                <p className="text-[#eeeeee] whitespace-pre-wrap">{comment.content}</p>
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
            <Button type="submit" className="bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white">
              Yorum Gönder
            </Button>
          </form>
        </Form>
      ) : (
        <p className="text-muted-foreground">Yorum yapmak için giriş yapmalısınız.</p>
      )}
    </div>
  );
}