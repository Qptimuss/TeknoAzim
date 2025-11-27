import { Link } from "react-router-dom";
import { getBlogPosts } from "@/lib/blog-store";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export default function Bloglar() {
  const { data: posts, isLoading, isError, error } = useQuery({
    queryKey: ["blogPosts"],
    queryFn: getBlogPosts,
    // React Query, pencere odaklandığında otomatik olarak yenileme yapar.
    // Bu, arka plandan dönüldüğünde verilerin güncel olmasını sağlar.
    staleTime: 1000 * 60 * 5, // 5 dakika boyunca veriyi taze kabul et
  });

  if (isError) {
    console.error("Blogları çekerken hata oluştu:", error);
    return (
      <div className="container mx-auto px-5 py-12 text-center">
        <h1 className="text-4xl font-bold text-destructive">Hata</h1>
        <p className="text-muted-foreground">Bloglar yüklenirken bir sorun oluştu.</p>
      </div>
    );
  }

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

      {isLoading ? (
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