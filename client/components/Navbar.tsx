import { Link, useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Gem } from "lucide-react";
import AppLogo from "./AppLogo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ThemeToggle } from "./ThemeToggle"; // ThemeToggle import edildi

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuHovered, setIsMobileMenuHovered] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Ana Sayfa bağlantısını sadece kullanıcı giriş yapmamışsa gösteriyoruz.
  const baseNavLinks = [
    { to: "/bloglar", label: "Bloglar" },
    { to: "/duyurular", label: "Duyurular" },
    { to: "/hakkimizda", label: "Hakkımızda" },
    { to: "/magaza", label: "Mağaza" },
  ];

  const mainNavLinks = user 
    ? baseNavLinks 
    : [{ to: "/", label: "Ana Sayfa" }, ...baseNavLinks];

  const guestLinks = [
    { to: "/kaydol", label: "Kaydol" },
    { to: "/giris", label: "Giriş Yap" },
  ];

  // Masaüstü için: Profil ve Çıkış Yap'ı tek bir menüde topluyoruz
  const authLinks = [
    { to: "/profil", label: "Profil" },
    { onClick: handleLogout, label: "Çıkış Yap" }, // Çıkış yap butonu olarak eklendi
  ];

  return (
    <header className="sticky top-0 z-50 px-5 md:px-10 lg:px-20 py-2 w-full">
      <div className="w-full max-w-[1122px] mx-auto">
        <nav className={cn(
          "inline-block lg:block rounded-[40px] bg-muted border-2 border-border p-1 transition-all duration-300 origin-top",
          isMobileMenuHovered && "transform scale-[1.01] shadow-xl shadow-black/20 dark:shadow-white/5"
        )}>
          {/* Mobile View */}
          <div className="lg:hidden flex items-center justify-between">
            <MobileNav 
              mainLinks={mainNavLinks} 
              authLinks={user ? authLinks : guestLinks} 
              logo={<AppLogo disableLink />} 
              user={user} 
              onMouseEnter={() => setIsMobileMenuHovered(true)}
              onMouseLeave={() => setIsMobileMenuHovered(false)}
            />
          </div>

          {/* Desktop View */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex rounded-[40px] bg-card border-2 border-border px-0 py-3 items-center gap-0 flex-1">
              <AppLogo /> 
              {mainNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className="font-bakbak text-sm lg:text-sm font-normal text-card-foreground whitespace-nowrap shrink-0 px-1 lg:px-2">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4 lg:gap-6 px-2">
              {user ? (
                <>
                  {/* Profil ve Avatar Grubu */}
                  <div className="flex items-center gap-2">
                    {/* Yeni Profil Bağlantısı */}
                    <Link 
                      to="/profil" 
                      className="font-bakbak text-base lg:text-base font-normal text-foreground whitespace-nowrap shrink-0 hover:text-primary transition-colors"
                    >
                      Profil
                    </Link>
                    
                    <div className="flex flex-col items-center">
                      <Link to="/profil">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.name || ''} />
                          <AvatarFallback>
                            <UserIcon className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to="/magaza" className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-0.5 text-xs mt-1">
                            <span className="font-bold">{user.gems ?? 0}</span>
                            <Gem className="h-3 w-3 text-green-500" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="font-bold">Elmas Kazancı</p>
                            <p>Her 24 saatte bir giriş: +20 Elmas</p>
                            <p>Her yeni rozet: +30 Elmas</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <Button onClick={handleLogout} variant="ghost" className="font-bakbak text-base lg:text-base font-normal text-foreground whitespace-nowrap shrink-0 p-0 hover:bg-transparent">
                    Çıkış Yap
                  </Button>
                  <ThemeToggle />
                </>
              ) : (
                <>
                  {guestLinks.map((link) => (
                    <Link key={link.to} to={link.to} className="font-bakbak text-base lg:text-base font-normal text-foreground whitespace-nowrap shrink-0">
                      {link.label}
                    </Link>
                  ))}
                  <ThemeToggle />
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}