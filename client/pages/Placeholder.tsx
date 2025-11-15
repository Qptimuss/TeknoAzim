import { Link } from "react-router-dom";

interface PlaceholderProps {
  title: string;
}

export default function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="bg-[#020303] min-h-screen">
      {/* Navigation Bar */}
      <nav className="px-5 md:px-10 lg:px-20 pt-14 pb-8">
        <div className="w-full max-w-[1122px] mx-auto rounded-[40px] bg-[#e6e6e6] border-2 border-[#2a2d31] p-1 md:p-2">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 lg:gap-8">
            {/* Dark Navigation Section */}
            <div className="rounded-[40px] bg-[#090a0c] border-2 border-[#42484c] px-5 md:px-7 py-5 flex flex-wrap items-center gap-4 md:gap-8 lg:gap-16 flex-1">
              <Link to="/" className="rounded-[25px] bg-[#d9d9d9] px-8 md:px-11 py-1 md:py-2">
                <div className="font-outfit text-xl md:text-2xl font-normal text-[#090a0c]">
                  Logo
                </div>
              </Link>
              <Link to="/" className="font-pacifico text-base md:text-xl font-normal text-white">
                Ana Sayfa
              </Link>
              <Link to="/bloglar" className="font-pacifico text-base md:text-xl font-normal text-white">
                Bloglar
              </Link>
              <Link to="/duyurular" className="font-pacifico text-base md:text-xl font-normal text-white">
                Duyurular
              </Link>
              <Link to="/hakkimizda" className="font-pacifico text-base md:text-xl font-normal text-white">
                Hakkımızda
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4 md:gap-6 lg:gap-8 px-4 md:px-0">
              <Link to="/kaydol" className="font-pacifico text-base md:text-xl font-normal text-[#090a0c]">
                Kaydol
              </Link>
              <Link to="/giris" className="font-pacifico text-base md:text-xl font-normal text-black">
                Giriş Yap
              </Link>
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
