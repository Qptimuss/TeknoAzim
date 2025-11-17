import React from 'react';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  imageClassName?: string;
}

const AppLogo = ({ className, imageClassName }: AppLogoProps) => {
  // The container styling mimics the original text logo's background and shape (rounded-[25px] bg-[#d9d9d9] px-6 md:px-8 py-1).
  // Using /placeholder.svg as the logo image.
  return (
    <div className={cn("rounded-[25px] bg-[#d9d9d9] px-6 md:px-8 py-1 shrink-0 flex items-center justify-center", className)}>
      <img
        src="/placeholder.svg"
        alt="TeknoAzim Logo"
        // h-6 is chosen to match the approximate height of the original text logo.
        className={cn("h-6 w-auto", imageClassName)} 
      />
    </div>
  );
};

export default AppLogo;