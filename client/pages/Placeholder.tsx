import { Link } from "react-router-dom";
import { MobileNav } from "@/components/MobileNav";

interface PlaceholderProps {
  title: string;
}

export default function Placeholder({ title }: PlaceholderProps) {
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
    <div className="bg-[#020303] min-h-screen">
      {/* Navigation Bar */}
      <nav className="px-5 md:px-10 lg:px-20 pt-14 pb-8">
        <div className="w-full max-w-[1122px] mx-auto rounded-[40px] bg-[#e6e6e6] border-2 border-[#2a2d31] p-1 md:p-2">
          <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-8">
            {/* Mobile Nav Trigger (visible only on small screens) */}
            <div className="md:hidden">
              <MobileNav mainLinks={mainNavLinks} authLinks={authNavLinks} logo={LogoContent} />
            </div>

            {/* Desktop Logo and Main Navigation Links (hidden on small screens) */}
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

            {/* Desktop Auth Buttons (hidden on small screens) */}
            <div className="hidden md:flex items-center gap-4 md:gap-6 lg:gap-8 px-4 md:px-0">
              {authNavLinks.map((link) => (
                <Link key={link.to} to={link.to} className="font-pacifico text-base md:text-lg font-normal text-[#090a0c] whitespace-nowrap shrink-0">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Placeholder Content */}
      <div className="flex flex-col items-center justify-center px-5 py-20">
        <div className="text-center max-w-2xl">
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-outfit font-bold mb-6">
            {title}
          </h1>
          <p className="text-[#eeeeee] text-xl md:text-2xl font-roboto font-normal mb-8">
            Bu sayfa henüz hazırlanıyor. İçerik eklemek için lütfen geliştiriciye bildirin.
          </p>
          <Link
            to="/"
            className="inline-block rounded-full bg-[#151313]/95 border border-[#42484c] px-12 py-4 font-roboto text-xl text-white hover:bg-[#151313] transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}