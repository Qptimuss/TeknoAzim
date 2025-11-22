import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlogPostWithAuthor } from "@shared/api";
import { Link } from "react-router-dom";
import LikeDislikeButtons from "./LikeDislikeButtons";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import ProfileAvatar from "./ProfileAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPostWithAuthor;
  showDelete?: boolean;
  onDelete?: (postId: string, imageUrl?: string | null) => void;
  hideProfileLink?: boolean;
}

export default function BlogCard({ post, showDelete = false, onDelete, hideProfileLink = false }: BlogCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="w-full flex flex-col transition-all hover:border-primary hover:scale-105 relative">
      {showDelete && onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 z-20 h-8 w-8"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(post.id, post.image_url);
          }}
          aria-label="Delete post"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Link to={`/bloglar/${post.id}`} className="flex flex-col flex-grow">
        <CardHeader>
          {post.image_url && (
            <div className="aspect-video overflow-hidden rounded-t-lg mb-4">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {post.profiles && (
            <div className="flex items-center justify-between w-full">
              <div 
                className={cn(
                  "inline-flex items-center gap-2 z-10 relative w-fit rounded-full bg-background px-3 py-1 border border-border",
                  !hideProfileLink && "transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10"
                )}
              >
                {hideProfileLink ? (
                  <div className="flex items-center gap-2">
                    <ProfileAvatar profile={post.profiles} className="h-6 w-6" />
                    <span className="text-sm text-foreground">
                      {post.profiles?.name || "Anonim"}
                    </span>
                  </div>
                ) : (
                  <>
                    <Link 
                      to={`/kullanici/${post.profiles.id}`} 
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ProfileAvatar profile={post.profiles} className="h-6 w-6" />
                      <span className="text-sm text-foreground">
                        {post.profiles?.name || "Anonim"}
                      </span>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 z-10 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Seçenekler</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem asChild>
                          <Link to={`/kullanici/${post.profiles.id}`}>Kullanıcının profiline bak</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          )}
          <CardTitle className="font-outfit text-2xl pt-2">{post.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-card-foreground line-clamp-3">{post.content}</p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between items-center pt-4">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <LikeDislikeButtons postId={post.id} />
      </CardFooter>
    </Card>
  );
}