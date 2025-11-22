import React from 'react';
import { FRAMES } from '@/lib/store-items';
import { cn } from '@/lib/utils';
import NovaFrame from './frames/NovaFrame';

interface AvatarFrameProps {
  frameName: string | null | undefined;
  children: React.ReactNode;
  className?: string;
}

export default function AvatarFrame({ frameName, children, className }: AvatarFrameProps) {
  if (frameName === 'Nova') {
    return (
      <div className={cn("p-1", className)}>
        <NovaFrame>{children}</NovaFrame>
      </div>
    );
  }

  const frame = FRAMES.find(f => f.name === frameName);

  return (
    <div className={cn("p-1", frame?.className, className)}>
      {children}
    </div>
  );
}