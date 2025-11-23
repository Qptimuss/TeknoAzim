import React from 'react';
import { cn } from '@/lib/utils';
import { Profile } from '@shared/api';
import { FRAMES } from '@/lib/store-items';
import NovaFrame from '@/components/frames/NovaFrame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';

interface ProfileAvatarProps {
  profile: Profile | null;
  className?: string; // This will be for the size, e.g., "h-8 w-8"
}

const ProfileAvatar = ({ profile, className }: ProfileAvatarProps) => {
  if (!profile) {
    return (
      <Avatar className={className}>
        <AvatarFallback>
          <UserIcon className="h-4/6 w-4/6" />
        </AvatarFallback>
      </Avatar>
    );
  }

  const selectedFrame = FRAMES.find(f => f.name === profile.selected_frame);

  const avatarComponent = (
    <Avatar className={className}>
      <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
      <AvatarFallback>
        <UserIcon className="h-4/6 w-4/6" />
      </AvatarFallback>
    </Avatar>
  );

  if (profile.selected_frame === 'Nova') {
    // NovaFrame is special and has its own structure.
    // It should be able to wrap a sized avatar.
    return <NovaFrame>{avatarComponent}</NovaFrame>;
  }

  if (selectedFrame) {
    // For other frames, we wrap the avatar in a div with the frame's styles.
    // The div itself shouldn't have size, it should derive from the child.
    return (
      <div className={cn("w-fit h-fit", selectedFrame.className)}>
        {avatarComponent}
      </div>
    );
  }

  // Default avatar with no frame
  return avatarComponent;
};

export default ProfileAvatar;