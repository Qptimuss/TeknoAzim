import { Profile } from "@shared/api";
import { calculateLevel, TITLES, ALL_BADGES } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import { Card } from "./ui/card";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  postCount: number;
}

export default function ProfileHeader({ profile, isOwnProfile, postCount }: ProfileHeaderProps) {
  const { level, expForNextLevel, currentLevelExp } = calculateLevel(profile.exp || 0);
  const expInCurrentLevel = (profile.exp || 0) - currentLevelExp;
  const expProgress = expForNextLevel === 0 ? 100 : (expInCurrentLevel / expForNextLevel) * 100;

  const selectedTitleObject = Object.values(TITLES).find(t => t.name === profile.selected_title);
  const SelectedTitleIcon = selectedTitleObject ? selectedTitleObject.icon : CheckCircle;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-card border border-border rounded-lg p-6 relative">
          <div className="flex flex-col items-center text-center">
            <ProfileAvatar profile={profile} className="h-24 w-24 mb-4" />
            <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
            {profile.selected_title && (
              <p className="text-yellow-400 font-semibold text-sm mt-1 flex items-center gap-1">
                <SelectedTitleIcon className="h-4 w-4" /> {profile.selected_title}
              </p>
            )}
            <p className="text-muted-foreground mt-2 text-sm">{profile.description || (isOwnProfile ? "Henüz bir açıklama eklemediniz." : "Kullanıcının bir açıklaması yok.")}</p>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">İstatistikler</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seviye</span>
                <span className="font-semibold">{level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam Gönderi</span>
                <span className="font-semibold">{postCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kazanılan Rozet</span>
                <span className="font-semibold">{profile.badges?.length ?? 0} / {ALL_BADGES.length}</span>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Seviye İlerlemesi</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="w-full">
                  <Progress value={expProgress} className="w-full" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toplam Deneyim: {profile.exp || 0} EXP</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="text-center text-sm text-muted-foreground mt-2">
              {`${expInCurrentLevel} / ${expForNextLevel} EXP`}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}