import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BlogPostWithAuthor } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { getBlogPosts } from "@/lib/blog-store";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Bloglar() {
  const [posts, setPosts] = useState<BlogPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const fetchedPosts = await getBlogPosts();
      setPosts(fetchedPosts);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <div className="container mx-auto px-5 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-white text-4xl md:text-5xl font-outfit font-bold">
          Bloglar
        </h1>
        <Button asChild size="lg" className="bg-[#151313]/95 border border-[#42484c] hover:bg-[#151313] text-white text-lg px-8 py-6">
          <Link to="/blog-olustur">
            Kendi Bloğunu Oluştur
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[225px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}