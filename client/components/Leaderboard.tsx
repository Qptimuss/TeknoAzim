import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLeaderboardProfiles } from "@/lib/profile-store";
import { Profile } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, User as UserIcon, MoreHorizontal } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import { calculateLevel, TITLES } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
        <CardDescription className="text-sm text-muted-foreground">
          Diğer kullanıcılarla liderlik tablosunda yarış!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profiles.map((profile, index) => {
          const { level } = calculateLevel(profile.exp || 0);
          const selectedTitleObject = Object.values(TITLES).find(t => t.name === profile.selected_title);
          const TitleIcon = selectedTitleObject ? selectedTitleObject.icon : UserIcon;

          const isSpecialUser = profile.is_special_leaderboard_user;
          const displayExpValue = Math.abs(profile.exp || 0); 

          return (
            <Link to={`/kullanici/${profile.id}`} key={profile.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border border-border transition-all hover:bg-muted hover:border-primary hover:shadow-md">
              <span className="font-bold text-lg w-6 text-center shrink-0">#{index + 1}</span>
              <ProfileAvatar profile={profile} className="h-10 w-10" />
              <div className="flex-1 min-w-0 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground text-wrap">{profile.name || "Anonim"}</p>
                  {profile.selected_title && (
                    <p className={cn("flex items-center gap-1 text-sm text-muted-foreground flex-wrap", selectedTitleObject?.color || "text-yellow-400")}>
                      <TitleIcon className="h-3 w-3" /> {profile.selected_title}
                    </p>
                  )}
                  <p className="font-medium text-sm text-muted-foreground mt-1">
                    Seviye {isSpecialUser ? ":)" : level}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Seçenekler</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link to={`/kullanici/${profile.id}`}>Kullanıcının profiline bak</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col items-end">
                <span className={cn("font-bold", isSpecialUser ? "text-red-500" : "text-primary")}>
                  {isSpecialUser ? ":)" : displayExpValue} EXP
                </span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}