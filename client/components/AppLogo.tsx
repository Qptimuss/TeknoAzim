import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";

interface AppLogoProps {
  className?: string;
  disableLink?: boolean;
}

// Geçici logo görseli olarak yerel placeholder.svg kullanılıyor.
const LOGO_IMAGE_URL = "/placeholder.svg"; 

const LogoContent = (
  // Orijinal metin logosunun boyutlarını ve arka plan stilini koruyoruz.
  <div className="rounded-[25px] bg-[#d9d9d9] px-6 md:px-8 py-1 shrink-0 flex items-center justify-center h-auto">
    {/* İstenen görsel logo kullanımı */}
    <img
      src={LOGO_IMAGE_URL}
      alt="TeknoAzim Logo"
      // Görseli rozet konteynerine sığacak şekilde boyutlandırıyoruz.
      className="h-6 w-auto object-contain" 
    />
  </div>
);

export default function AppLogo({ className, disableLink = false }: AppLogoProps) {
  if (disableLink) {
    return <div className={cn("flex items-center shrink-0", className)}>{LogoContent}</div>;
  }

  // Varsayılan olarak ana sayfaya bağlantı verir.
  return (
    <Link to="/" className={cn("flex items-center shrink-0", className)}>
      {LogoContent}
    </Link>
  );
}