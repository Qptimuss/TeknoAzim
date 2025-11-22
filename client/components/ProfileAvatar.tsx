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

  const avatarElement = (
    <Avatar className={className}>
      <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
      <AvatarFallback>
        <UserIcon />
      </AvatarFallback>
    </Avatar>
  );

  if (profile.selected_frame === 'Nova') {
    return <NovaFrame>{avatarElement}</NovaFrame>;
  }

  if (selectedFrame) {
    // The parent component will handle padding and layout.
    // This component just applies the frame's core classes.
    return <div className={cn(selectedFrame.className)}>{avatarElement}</div>;
  }

  return avatarElement;
}