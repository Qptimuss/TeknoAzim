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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

interface BlogCardProps {
  post: BlogPostWithAuthor;
}

export default function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="w-full bg-[#090a0c] border-[#2a2d31] text-white flex flex-col transition-all hover:border-[#6b7280] hover:scale-105">
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
            <Link 
              to={`/kullanici/${post.profiles.id}`} 
              className="inline-flex items-center gap-2 z-10 relative w-fit rounded-full bg-[#151313] px-3 py-1 border border-[#42484c] transition-all duration-200 hover:border-[#6b7280] hover:-translate-y-0.5 hover:shadow-md hover:shadow-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.profiles?.avatar_url || undefined} alt={post.profiles?.name || ''} />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-[#eeeeee]">
                {post.profiles?.name || "Anonim"}
              </span>
            </Link>
          )}
          <CardTitle className="font-outfit text-2xl pt-2">{post.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-[#eeeeee] line-clamp-3">{post.content}</p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between items-center pt-4">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <LikeDislikeButtons postId={post.id} />
      </CardFooter>
    </Card>
  );
}