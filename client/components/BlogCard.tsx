import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlogPost } from "@shared/api";
import { Link } from "react-router-dom";
import LikeDislikeButtons from "./LikeDislikeButtons";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="w-full bg-[#090a0c] border-[#2a2d31] text-white flex flex-col transition-all hover:border-white/50 hover:scale-105">
      <Link to={`/bloglar/${post.id}`} className="flex flex-col flex-grow">
        <CardHeader>
          {post.imageUrl && (
            <div className="aspect-video overflow-hidden rounded-t-lg mb-4">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardTitle className="font-outfit text-2xl">{post.title}</CardTitle>
          <CardDescription className="text-[#eeeeee] pt-2">
            {post.author} tarafından
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-[#eeeeee] line-clamp-3">{post.content}</p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <LikeDislikeButtons postId={post.id} initialLikes={post.likes} initialDislikes={post.dislikes} />
      </CardFooter>
    </Card>
  );
}