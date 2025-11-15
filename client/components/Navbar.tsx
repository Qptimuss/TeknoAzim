import { Link, useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/MobileNav";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const mainNavLinks = [
    { to: "/", label: "Ana Sayfa" },
    { to: "/bloglar", label: "Bloglar" },
    { to: "/duyurular", label: "Duyurular" },
    { to: "/hakkimizda", label: "Hakkımızda" },
  ];

  const guestLinks = [
    { to: "/kaydol", label: "Kaydol" },
    { to: "/giris", label: "Giriş Yap" },
  ];

  const authLinks = [
    { to: "/profil", label: "Profil" },
  ];

  const LogoContent = (
    <div className="rounded-[25px] bg-[#d9d9d9] px-6 md:px-8 py-1 shrink-0">
      <div className="font-outfit text-lg md:text-xl font-normal text-[#090a0c] whitespace-nowrap">
        Logo
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 px-5 md:px-10 lg:px-20 py-2 w-full">
      <div className="w-full max-w-[1122px] mx-auto">
        <nav className="rounded-[40px] bg-[#e6e6e6] border-2 border-[#2a2d31] p-1">
          <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-8">
            <div className="md:hidden">
              <MobileNav mainLinks={mainNavLinks} authLinks={user ? authLinks : guestLinks} logo={LogoContent} />
            </div>
            <div className="hidden md:flex rounded-[40px] bg-[#090a0c] border-2 border-[#42484c] px-4 md:px-6 py-3 items-center gap-4 md:gap-6 lg:gap-10 flex-1">
              <Link to="/" className="flex items-center">
                {LogoContent}
              </Link>
              {mainNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className="font-pacifico text-base md:text-lg font-normal text-white whitespace-nowrap shrink-0">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-4 md:gap-6 lg:gap-8 px-4 md:px-0">
              {user ? (
                <>
                  <Link to="/profil" className="font-pacifico text-base md:text-lg font-normal text-[#090a0c] whitespace-nowrap shrink-0">
                    Profil
                  </Link>
                  <Button onClick={handleLogout} variant="ghost" className="font-pacifico text-base md:text-lg font-normal text-[#090a0c] whitespace-nowrap shrink-0 p-0 hover:bg-transparent">
                    Çıkış Yap
                  </Button>
                </>
              ) : (
                guestLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="font-pacifico text-base md:text-lg font-normal text-[#090a0c] whitespace-nowrap shrink-0">
                    {link.label}
                  </Link>
                ))
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}