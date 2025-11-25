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

// Deterministic color palette for avatar fallback
const AVATAR_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
];

// Helper to get initials (first two characters)
const getInitials = (name: string | null | undefined): string | undefined => {
  if (!name) return undefined;
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length > 1) {
    // If multiple words, take the first letter of the first two words
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  // If one word, take the first two letters
  return name.substring(0, 2).toUpperCase();
};

// Helper to select a deterministic color based on the user's name
const getDeterministicColor = (name: string | null | undefined): string => {
  if (!name) return "bg-gray-500";
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const ProfileAvatar = ({ profile, className }: ProfileAvatarProps) => {
  const initials = getInitials(profile?.name);
  const fallbackColor = getDeterministicColor(profile?.name);

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
      <AvatarFallback className={cn(fallbackColor, "text-white font-bold")}>
        {initials || <UserIcon className="h-4/6 w-4/6" />}
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