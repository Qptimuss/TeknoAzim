import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function CreateBlogCard() {
  return (
    <Link to="/blog-olustur" className="flex flex-col h-full">
      <div className="w-full h-full bg-[#090a0c] border-2 border-dashed border-[#42484c] text-white flex flex-col items-center justify-center transition-all hover:border-[#6b7280] hover:scale-105 rounded-lg p-4 flex-grow hover:bg-[#151313]/50">
        <Plus className="h-12 w-12 text-muted-foreground" />
        <span className="mt-4 font-outfit text-lg text-center text-muted-foreground">
          Yeni Blog Oluştur
        </span>
      </div>
    </Link>
  );
}