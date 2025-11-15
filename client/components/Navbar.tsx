import { Link } from "react-router-dom";
import { MobileNav } from "@/components/MobileNav";

export default function Navbar() {
  const mainNavLinks = [
    { to: "/", label: "Ana Sayfa" },
    { to: "/bloglar", label: "Bloglar" },
    { to: "/duyurular", label: "Duyurular" },
    { to: "/hakkimizda", label: "Hakkımızda" },
  ];

  const authNavLinks = [
    { to: "/kaydol", label: "Kaydol" },
    { to: "/giris", label: "Giriş Yap" },
  ];

  const LogoContent = (
    <div className="rounded-[25px] bg-[#d9d9d9] px-6 md:px-8 py-1 shrink-0">
      <div className="font-outfit text-lg md:text-xl font-normal text-[#090a0c] whitespace-nowrap">
        Logo
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 px-5 md:px-10 lg:px-20 py-4 w-full">
      <div className="w-full max-w-[1122px] mx-auto">
        <nav className="rounded-[40px] bg-[#e6e6e6] border-2 border-[#2a2d31] p-1 md:p-2">
          <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-8">
            <div className="md:hidden">
              <MobileNav mainLinks={mainNavLinks} authLinks={authNavLinks} logo={LogoContent} />
            </div>
            <div className="hidden md:flex rounded-[40px] bg-[#090a0c] border-2 border-[#42484c] px-4 md:px-6 py-4 items-center gap-4 md:gap-6 lg:gap-10 flex-1">
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
              {authNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className="font-pacifico text-base md:text-lg font-normal text-[#090a0c] whitespace-nowrap shrink-0">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}