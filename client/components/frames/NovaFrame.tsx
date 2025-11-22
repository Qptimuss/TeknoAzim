import React from 'react';
import { cn } from '@/lib/utils';
import './NovaFrame.css';

interface NovaFrameProps {
  children: React.ReactNode;
  className?: string;
}

const NovaFrame = ({ children, className }: NovaFrameProps) => {
  const starCount = 12;

  return (
    <div className={cn("relative w-fit h-fit", className)}>
      <div className="nova-stars-orbit">
        {Array.from({ length: starCount }).map((_, i) => {
          const angle = (i / starCount) * 360;
          return (
            <div
              key={i}
              className="nova-star-wrapper"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div
                className="nova-star"
                style={{ animationDelay: `${(i / starCount) * 2}s` }}
              />
            </div>
          );
        })}
      </div>
      <div className="relative z-10 p-1 bg-gradient-to-tr from-purple-500 via-indigo-700 to-fuchsia-500 rounded-full shadow-[0_0_20px_theme(colors.purple.400)]">
        <div className="p-1 bg-black rounded-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default NovaFrame;