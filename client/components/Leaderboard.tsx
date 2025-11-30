import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLeaderboardProfiles } from "@/lib/profile-store";
import { Profile } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, User as UserIcon } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import { calculateLevel, TITLES } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboardProfiles();
        setProfiles(data);
        setError(null);
      } catch (e) {
        setError("Liderlik tablosu yüklenirken bir hata oluştu.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="p-4 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4 bg-card border border-border rounded-lg">
        {error}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-muted-foreground text-center p-4 bg-card border border-border rounded-lg">
        Liderlik tablosunda gösterilecek kullanıcı bulunamadı.
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-outfit flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" /> Liderlik Tablosu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profiles.map((profile, index) => {
          const { level } = calculateLevel(profile.exp || 0);
          const selectedTitleObject = Object.values(TITLES).find(t => t.name === profile.selected_title);
          const TitleIcon = selectedTitleObject ? selectedTitleObject.icon : UserIcon;

          return (
            <Link to={`/kullanici/${profile.id}`} key={profile.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border transition-all hover:bg-muted hover:border-primary hover:shadow-md">
              <span className="font-bold text-lg w-6 text-center shrink-0">#{index + 1}</span>
              <ProfileAvatar profile={profile} className="h-10 w-10" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{profile.name || "Anonim"}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Seviye {level}</span>
                  {profile.selected_title && (
                    <span className={cn("flex items-center gap-1", selectedTitleObject?.color || "text-yellow-400")}>
                      <TitleIcon className="h-3 w-3" /> {profile.selected_title}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-primary">{profile.exp} EXP</span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}