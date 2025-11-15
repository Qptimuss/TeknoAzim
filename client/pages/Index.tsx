import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="bg-[#020303] min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[960px] w-full">
        {/* Background Image */}
        <img
          loading="lazy"
          srcSet="https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true&width=100 100w, https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true&width=200 200w, https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true&width=400 400w, https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true&width=800 800w, https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true&width=1200 1200w, https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true&width=1600 1600w, https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true&width=2000 2000w"
          src="https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab?placeholderIfAbsent=true"
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
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 lg:gap-8">
                {/* Dark Navigation Section */}
                <div className="rounded-[40px] bg-[#090a0c] border-2 border-[#42484c] px-5 md:px-7 py-5 flex flex-nowrap items-center gap-4 md:gap-8 lg:gap-16 flex-1 overflow-x-auto">
                  <div className="rounded-[25px] bg-[#d9d9d9] px-8 md:px-11 py-1 md:py-2 shrink-0">
                    <div className="font-outfit text-xl md:text-2xl font-normal text-[#090a0c] whitespace-nowrap">
                      Logo
                    </div>
                  </div>
                  <Link to="/" className="font-pacifico text-base md:text-xl font-normal text-white whitespace-nowrap shrink-0">
                    Ana Sayfa
                  </Link>
                  <Link to="/bloglar" className="font-pacifico text-base md:text-xl font-normal text-white whitespace-nowrap shrink-0">
                    Bloglar
                  </Link>
                  <Link to="/duyurular" className="font-pacifico text-base md:text-xl font-normal text-white whitespace-nowrap shrink-0">
                    Duyurular
                  </Link>
                  <Link to="/hakkimizda" className="font-pacifico text-base md:text-xl font-normal text-white whitespace-nowrap shrink-0">
                    Hakkımızda
                  </Link>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center flex-nowrap gap-4 md:gap-6 lg:gap-8 px-4 md:px-0">
                  <Link to="/kaydol" className="font-pacifico text-base md:text-xl font-normal text-[#090a0c] whitespace-nowrap shrink-0">
                    Kaydol
                  </Link>
                  <Link to="/giris" className="font-pacifico text-base md:text-xl font-normal text-black whitespace-nowrap shrink-0">
                    Giriş Yap
                  </Link>
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
          <div className="mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-white text-xl md:text-2xl lg:text-[25px] font-outfit font-semibold tracking-[2.5px] uppercase">
              Duyurular
            </h2>

            <p className="text-white text-4xl md:text-5xl lg:text-[70px] font-outfit font-bold leading-tight md:leading-[85px] mt-4 max-w-[647px]">
              Duyurularda son gelişmelerle İlgili bilgi edin.
            </p>
          </div>

          {/* Announcements Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-5 mb-12 md:mb-16 lg:mb-20">
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

            {/* Image Column */}
            <div className="flex items-start justify-end pt-6 md:pt-8 lg:pt-10">
              <img
                loading="lazy"
                srcSet="https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true&width=100 100w, https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true&width=200 200w, https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true&width=400 400w, https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true&width=800 800w, https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true&width=1200 1200w, https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true&width=1600 1600w, https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true&width=2000 2000w"
                src="https://api.builder.io/api/v1/image/assets/TEMP/61d24d093dffa5e4e7ae4c69427cfcb76e11806e?placeholderIfAbsent=true"
                alt="Duyurular"
                className="w-auto h-auto object-contain max-w-sm md:max-w-md lg:max-w-lg"
              />
            </div>
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
                  srcSet="https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f?placeholderIfAbsent=true&width=100 100w, https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f?placeholderIfAbsent=true&width=200 200w, https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f?placeholderIfAbsent=true&width=400 400w, https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f?placeholderIfAbsent=true&width=800 800w, https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3181a495439504b4d43051569e264a2f?placeholderIfAbsent=true&width=1200 1200w, https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f?placeholderIfAbsent=true&width=1600 1600w, https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f?placeholderIfAbsent=true&width=2000 2000w"
                  src="https://api.builder.io/api/v1/image/assets/TEMP/000e1e6d3182a495439504b4d43051569e264a2f?placeholderIfAbsent=true"
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