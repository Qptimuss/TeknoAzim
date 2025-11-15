import { Link } from "react-router-dom";
import { MobileNav } from "@/components/MobileNav";

export default function Index() {
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
    <div className="bg-[#020303] min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[960px] w-full">
        {/* Background Image */}
        <img
          loading="lazy"
          srcSet="https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab"
          src="https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Gradient Overlay - Black at bottom, transparent at top */}
        <div className="absolute inset-0 h-full w-full bg-gradient-to-t from-[#020303] from-0% via-[#020303]/50 via-30% to-transparent to-100%" />

        {/* Content Container */}
        <div className="relative z-10 px-5 md:px-10 lg:px-20 pt-14 pb-8 flex flex-col items-center">
          <div className="w-full max-w-[1122px]">
            {/* Navigation Bar */}
            <nav className="rounded-[40px] bg-[#e6e6e6] border-2 border-[#2a2d31] p-1 md:p-2">
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
            </nav>

            {/* Hero Content */}
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-outfit font-bold text-center mt-12 md:mt-16 lg:mt-20 px-4">
              Düşüncelerle derinleşen,yazılarla genişleyen bir dünya.
            </h1>

            <p className="text-[#eeeeee] text-lg md:text-2xl lg:text-[25px] font-roboto font-normal text-center mt-6 md:mt-8 px-4">
              Hobilerinle ilgili bilgilerini diğer öğrencilerle paylaş.
            </p>

            <div className="flex justify-center mt-8 md:mt-10">
              <button className="rounded-full bg-[#151313]/95 border border-[#42484c] px-16 md:px-20 lg:px-24 py-5 md:py-6 font-roboto text-2xl md:text-3xl text-white hover:bg-[#151313] transition-colors">
                Başla
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Black Background Container - Announcements and Security */}
      <section className="bg-[#020303] w-full">
        {/* Announcements Section */}
        <div className="w-full max-w-[1122px] mx-auto px-5 md:px-10 lg:px-20 py-12 md:py-16 lg:py-20">
          {/* Announcements Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 md:mb-16 lg:mb-20">
            <div className="flex flex-col">
              <h2 className="text-white text-xl md:text-2xl lg:text-[25px] font-outfit font-semibold tracking-[2.5px] uppercase">
                Duyurular
              </h2>
              <p className="text-white text-4xl md:text-5xl lg:text-[70px] font-outfit font-bold leading-tight md:leading-[85px] mt-4 max-w-[647px]">
                Duyurularda son gelişmelerle İlgili bilgi edin.
              </p>
            </div>
            {/* Megafon görseli buraya taşındı */}
            <img
              loading="lazy"
              srcSet="https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e"
              src="https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e"
              alt="Duyurular"
              className="w-auto h-auto object-contain max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[250px] mt-4 md:mt-0 md:ml-8"
            />
          </div>

          {/* Announcements Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-5 mb-12 md:mb-16 lg:mb-20 items-center">
            {/* Text Column */}
            <div className="flex flex-col justify-start">
              <p className="text-[#eeeeee] text-xl md:text-2xl lg:text-[25px] font-roboto font-medium leading-relaxed md:leading-[40px]">
                Okulumuzdaki AZİM grubu ve sitedeki güncellemelerle İlgili duyurulara eriş.
              </p>

              <div className="flex justify-start mt-8 md:mt-10 lg:mt-12">
                <button className="rounded-full bg-[#151313]/95 border border-[#42484c] px-12 md:px-16 py-5 md:py-6 font-roboto text-2xl md:text-3xl text-white font-bold hover:bg-[#151313] transition-colors">
                  Göz at
                </button>
              </div>
            </div>

            {/* Eski görsel sütunu kaldırıldı */}
            <div></div> 
          </div>
        </div>

        {/* Security Section */}
        <div className="w-full border-t border-[#2a2d31]">
          <div className="max-w-[1122px] mx-auto px-5 md:px-10 lg:px-20 py-12 md:py-16 lg:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-5">
              {/* Image Column */}
              <div className="relative min-h-[300px] md:min-h-[400px] lg:min-h-[500px] flex items-end justify-end">
                <img
                  loading="lazy"
                  srcSet="https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f"
                  src="https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f"
                  alt="Güvenlik"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Text Column */}
              <div className="flex flex-col justify-start">
                <h2 className="text-white text-xl md:text-2xl lg:text-[25px] font-outfit font-semibold tracking-[2.5px] uppercase mb-6 md:mb-8">
                  Güvenlik
                </h2>

                <h3 className="text-white text-4xl md:text-5xl lg:text-[70px] font-outfit font-bold leading-tight md:leading-[85px]">
                  Kötü söz ve İçerikleri filtreleyen yapay zeka desteği
                </h3>

                <p className="text-[#eeeeee] text-xl md:text-2xl lg:text-[25px] font-roboto font-medium leading-relaxed md:leading-[40px] mt-6 md:mt-8">
                  Blog, mini-makale ve yorumlarda filtrelenmiş sohbet ile fikirlerini paylaş.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="px-5 md:px-10 lg:px-40 py-12 md:py-16 lg:py-20">
        <p className="text-white text-lg md:text-xl lg:text-2xl font-roboto font-medium leading-relaxed md:leading-[40px]">
          Okumayan ve yazmayan insan düşünemez. (Ali Fuat Başgil,{" "}
          <span className="italic">Gençlerle Başbaşa</span>)
        </p>
      </section>
    </div>
  );
}