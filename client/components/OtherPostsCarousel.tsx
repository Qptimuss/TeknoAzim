import { useQuery } from "@tanstack/react-query";
import { getBlogPosts } from "@/lib/blog-store";
import { BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface OtherPostsCarouselProps {
  currentPostId: string;
}

export default function OtherPostsCarousel({ currentPostId }: OtherPostsCarouselProps) {
  const { data: allPosts, isLoading: loading, error } = useQuery<BlogPostWithAuthor[]>({
    queryKey: ['blogPosts'],
    queryFn: getBlogPosts,
  });

  const posts = allPosts
    ? allPosts.filter(post => post.id !== currentPostId).slice(0, 10)
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-80 w-64 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 mt-12">Diğer bloglar yüklenemedi.</div>;
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-foreground text-3xl font-outfit font-bold">
          Diğer Bloglar
        </h2>
        <Link to="/bloglar" className="text-primary hover:underline flex items-center gap-1 text-lg font-medium">
          Tümünü Gör <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {posts.map((post) => (
            <CarouselItem key={post.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              {/* BlogCard'ı karusel içinde kullanıyoruz */}
              <BlogCard post={post} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-12 hidden md:flex" />
        <CarouselNext className="-right-12 hidden md:flex" />
      </Carousel>
    </div>
  );
}