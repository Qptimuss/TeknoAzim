import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gem, LogOut, User, PenSquare } from "lucide-react";
import { useProfile } from "../hooks/useProfile"; // DÜZELTME: Göreceli yol kullanıldı.
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navbar() {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name[0];
  };

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary">
            BlogFusion
          </Link>
          <div className="flex items-center space-x-4">
            {loading || profileLoading ? (
              <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
            ) : user ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2 bg-muted px-3 py-1.5 rounded-full text-sm font-medium">
                        <Gem className="h-4 w-4 text-blue-500" />
                        <span>{profile?.gems ?? 0}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-bold">Nasıl Elmas Kazanırım?</p>
                        <p>Her 24 saatte bir giriş: +20 Elmas</p>
                        <p>Her yeni rozet kazandığında: +30 Elmas</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Sahip olduğun çerçeveler sandıktan çıkarsa,
                        </p>
                        <p className="text-xs text-muted-foreground">
                          nadirliğe göre Elmas iadesi alırsın.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button asChild>
                  <Link to="/blog-olustur">
                    <PenSquare className="h-4 w-4 mr-2" />
                    Yazı Yaz
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(profile?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/profil`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link to="/giris">Giriş Yap</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}