import { Link } from "react-router-dom";

interface PlaceholderProps {
  title: string;
}

export default function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-5 py-20 text-center">
      <div className="max-w-2xl">
        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-outfit font-bold mb-6">
          {title}
        </h1>
        <p className="text-[#eeeeee] text-xl md:text-2xl font-roboto font-normal mb-8">
          Bu sayfa henüz hazırlanıyor. İçerik yakında eklenecektir.
        </p>
        <Link
          to="/"
          className="inline-block rounded-full bg-[#151313]/95 border border-[#42484c] px-12 py-4 font-roboto text-xl text-white hover:bg-[#151313] transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}