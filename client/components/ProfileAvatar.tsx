import { Profile } from "@shared/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import NovaFrame from "./frames/NovaFrame";
import { FRAMES } from "@/lib/store-items";

interface ProfileAvatarProps {
  profile: Pick<Profile, 'name' | 'avatar_url' | 'selected_frame'> | null;
  className?: string;
}

const getInitials = (name?: string | null) => {
  if (!name) return "AN";
  const names = name.trim().split(/\s+/);
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return (names[0][0] + (names[1]?.[0] || '')).toUpperCase();
};

export default function ProfileAvatar({ profile, className }: ProfileAvatarProps) {
  const selectedFrame = FRAMES.find(f => f.name === profile?.selected_frame);

  const AvatarComponent = (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name || 'Avatar'} />
      <AvatarFallback>
        {profile?.name ? getInitials(profile.name) : <UserIcon className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );

  if (profile?.selected_frame === 'Nova') {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <NovaFrame animated={false}>
          {AvatarComponent}
        </NovaFrame>
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center p-0.5", selectedFrame?.className, className)}>
      {AvatarComponent}
    </div>
  );
}