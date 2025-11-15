import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { addComment } from "@/lib/blog-store";
import { Comment } from "@shared/api";
import { toast } from "sonner";

const commentSchema = z.object({
  author: z.string().min(2, "İsim en az 2 karakter olmalıdır."),
  content: z.string().min(3, "Yorum en az 3 karakter olmalıdır."),
});

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: () => void;
}

export default function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { author: "", content: "" },
  });

  function onSubmit(values: z.infer<typeof commentSchema>) {
    addComment(postId, values);
    toast.success("Yorumunuz eklendi!");
    form.reset();
    onCommentAdded();
  }

  return (
    <div className="mt-12">
      <Separator className="bg-[#2a2d31] mb-8" />
      <h2 className="text-white text-3xl font-outfit font-bold mb-6">Yorumlar ({comments.length})</h2>
      
      {/* Yorum Listesi */}
      <div className="space-y-6 mb-8">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-[#151313]/50 p-4 rounded-lg border border-[#2a2d31]">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white">{comment.author}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.date).toLocaleString("tr-TR")}
                </p>
              </div>
              <p className="text-[#eeeeee]">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
        )}
      </div>

      {/* Yorum Formu */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Adınız</FormLabel>
                <FormControl>
                  <Input placeholder="Adınızı girin" {...field} className="bg-[#151313] border-[#42484c] text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Yorumunuz</FormLabel>
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
    </div>
  );
}