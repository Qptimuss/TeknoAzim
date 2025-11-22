import { cn } from "@/lib/utils";
import { Profile } from "@shared/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User as UserIcon } from "lucide-react";
import { FRAMES } from "@/lib/store-items";
import NovaFrame from "./frames/NovaFrame";

interface ProfileAvatarProps {
  profile: Profile | null;
  className?: string;
}

export default function ProfileAvatar({ profile, className }: ProfileAvatarProps) {
  if (!profile) {
    return (
      <Avatar className={className}>
        <AvatarFallback>
          <UserIcon />
        </AvatarFallback>
      </Avatar>
    );
  }

  const selectedFrame = FRAMES.find(f => f.name === profile.selected_frame);

  // The core avatar element, which should fill its parent container.
  const avatarElement = (
    <Avatar className="h-full w-full">
      <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
      <AvatarFallback>
        <UserIcon />
      </AvatarFallback>
    </Avatar>
  );

  if (profile.selected_frame === 'Nova') {
    // Apply size to the NovaFrame wrapper
    return <NovaFrame className={className}>{avatarElement}</NovaFrame>;
  }

  if (selectedFrame) {
    // Apply size and frame styles to the wrapper div.
    // The avatarElement will fill the space inside the border/padding.
    return <div className={cn(selectedFrame.className, className)}>{avatarElement}</div>;
  }

  // No frame, just the avatar with the size class.
  return (
    <Avatar className={className}>
      <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
      <AvatarFallback>
        <UserIcon />
      </AvatarFallback>
    </Avatar>
  );
}