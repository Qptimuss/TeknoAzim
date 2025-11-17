import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";

interface AppLogoProps {
  className?: string;
  disableLink?: boolean;
}

// Yeni logo görseli yolu
const LOGO_IMAGE_URL = "/logo.png"; 

const LogoContent = (
  // Orijinal boyutları koruyoruz, ancak arka plan rengini kaldırıyoruz.
  <div className="rounded-[25px] px-6 md:px-8 py-1 shrink-0 flex items-center justify-center h-auto">
    {/* İstenen görsel logo kullanımı */}
    <img
      src={LOGO_IMAGE_URL}
      alt="TeknoAzim Logo"
      // Görseli rozet konteynerine sığacak şekilde boyutlandırıyoruz. Reverted size to h-12
      className="h-12 w-auto object-contain" 
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