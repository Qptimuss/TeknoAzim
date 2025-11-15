import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@shared/api";
import BlogCard from "@/components/BlogCard";
import { getBlogPosts } from "@/lib/blog-store";
import { Link } from "react-router-dom";

export default function Bloglar() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    setPosts(getBlogPosts());
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}