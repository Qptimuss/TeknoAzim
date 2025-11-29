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
  // Yatay dolguyu azaltarak logoyu daha kompakt hale getiriyoruz.
  <div className="rounded-[25px] px-4 md:px-6 py-1 shrink-0 flex items-center justify-center h-auto">
    {/* İstenen görsel logo kullanımı */}
    <img
      src={LOGO_IMAGE_URL}
      alt="TeknoAzim Logo"
      // Görseli rozet konteynerine sığacak şekilde boyutlandırıyoruz. Set size to h-10
      className="h-10 w-auto object-contain" 
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