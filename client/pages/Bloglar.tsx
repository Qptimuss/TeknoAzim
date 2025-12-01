import { Link } from "react-router-dom";
import { getBlogPosts } from "@/lib/blog-store";
import { BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export default function Bloglar() {
  const { data: posts, isLoading: loading, error } = useQuery<BlogPostWithAuthor[]>({
    queryKey: ['blogPosts'],
    queryFn: getBlogPosts,
  });

  return (
    <div className="container mx-auto px-5 py-12">
      <div className="flex flex-wrap justify-between items-center gap-y-4 mb-8">
        <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold whitespace-nowrap">
          Bloglar
        </h1>
        <Button asChild size="lg" className="text-lg w-full sm:w-auto px-8 py-6 transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
          <Link to="/blog-olustur">Yeni Blog Yazısı Oluştur</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col space-y-3">
              <Skeleton className="h-[225px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 text-center col-span-full bg-card border border-border rounded-lg p-8">
          Bloglar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts?.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}