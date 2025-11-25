import { Link } from "react-router-dom";
import { Construction } from "lucide-react";

export default function Duyurular() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-5 py-20 text-center">
      <div className="max-w-4xl">
        <Construction className="h-16 w-16 text-yellow-500 mx-auto mb-6 animate-pulse" />
        <h1 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-outfit font-bold mb-4">
          Duyurular
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-roboto font-normal leading-relaxed">
          Bu bölüm geliştirilme aşamasındadır. Yakında güncel duyurulara buradan ulaşabileceksiniz.
        </p>
        <Link to="/" className="mt-8 inline-block text-primary hover:underline">
          Ana Sayfaya Geri Dön
        </Link>
      </div>
    </div>
  );
}