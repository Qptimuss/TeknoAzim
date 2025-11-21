import { Link } from "react-router-dom";

export default function Index() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[960px] w-full -mt-28">
        {/* Background Image */}
        <img
          loading="lazy"
          srcSet="https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab"
          src="https://api.builder.io/api/v1/image/assets/TEMP/3bc0c855f8b22bc173924caed963ce3a0bbee0ab"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Gradient Overlay - Only in dark mode */}
        <div className="absolute inset-0 h-full w-full dark:bg-gradient-to-t dark:from-background dark:via-background/70 dark:to-background/40" />

        {/* Content Container */}
        <div className="relative z-10 px-5 md:px-10 lg:px-20 pb-8 flex flex-col items-center pt-32">
          <div className="w-full max-w-[1122px]">
            {/* Hero Content */}
            <h1 className="text-foreground dark:text-foreground text-3xl md:text-4xl lg:text-5xl font-outfit font-bold text-center mt-12 md:mt-16 lg:mt-20 px-4">
              Düşüncelerle derinleşen,yazılarla genişleyen bir dünya.
            </h1>

            <p className="text-muted-foreground dark:text-muted-foreground text-lg md:text-2xl lg:text-[25px] font-roboto font-normal text-center mt-6 md:mt-8 px-4">
              Hobilerinle ilgili bilgilerini diğer öğrencilerle paylaş.
            </p>

            <div className="flex justify-center mt-8 md:mt-10">
              <Link
                to="/kaydol"
                className="rounded-full bg-transparent border border-border px-16 md:px-20 lg:px-24 py-5 md:py-6 font-roboto text-2xl md:text-3xl text-foreground hover:bg-accent transition-colors text-center"
              >
                Başla
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Black Background Container - Announcements and Security */}
      <section className="bg-background w-full">
        {/* Announcements Section */}
        <div className="w-full max-w-[1122px] mx-auto px-5 md:px-10 lg:px-20 py-12 md:py-16 lg:py-20">
          {/* Announcements Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 md:mb-16 lg:mb-20">
            <div className="flex flex-col">
              <h2 className="text-foreground text-xl md:text-2xl lg:text-[25px] font-outfit font-semibold tracking-[2.5px] uppercase">
                Duyurular
              </h2>
              <p className="text-foreground text-4xl md:text-5xl lg:text-[70px] font-outfit font-bold leading-tight md:leading-[85px] mt-4 max-w-[647px]">
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
              <p className="text-muted-foreground text-xl md:text-2xl lg:text-[25px] font-roboto font-medium leading-relaxed md:leading-[40px]">
                Okulumuzdaki AZİM grubu ve sitedeki güncellemelerle İlgili duyurulara eriş.
              </p>

              <div className="flex justify-start mt-8 md:mt-10 lg:mt-12">
                <Link
                  to="/duyurular"
                  className="rounded-full bg-transparent border border-border px-12 md:px-16 py-5 md:py-6 font-roboto text-2xl md:text-3xl text-foreground font-bold hover:bg-accent transition-colors text-center"
                >
                  Göz at
                </Link>
              </div>
            </div>

            {/* Eski görsel sütunu kaldırıldı */}
            <div></div> 
          </div>
        </div>

        {/* Security Section */}
        <div className="w-full border-t border-border">
          <div className="max-w-[1122px] mx-auto px-5 md:px-10 lg:px-20 py-12 md:py-16 lg:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-5">
              {/* Image Column */}
              <div className="relative min-h-[300px] md:min-h-[400px] lg:min-h-[500px] flex items-center justify-center">
                <img
                  loading="lazy"
                  src="/cyberbrain.png"
                  alt="Güvenlik"
                  className="w-full h-auto object-contain max-w-md"
                />
              </div>

              {/* Text Column */}
              <div className="flex flex-col justify-start">
                <h2 className="text-foreground text-xl md:text-2xl lg:text-[25px] font-outfit font-semibold tracking-[2.5px] uppercase mb-6 md:mb-8">
                  Güvenlik
                </h2>

                <h3 className="text-foreground text-4xl md:text-5xl lg:text-[70px] font-outfit font-bold leading-tight md:leading-[85px]">
                  Kötü söz ve İçerikleri filtreleyen yapay zeka desteği
                </h3>

                <p className="text-muted-foreground text-xl md:text-2xl lg:text-[25px] font-roboto font-medium leading-relaxed md:leading-[40px] mt-6 md:mt-8">
                  Blog, mini-makale ve yorumlarda filtrelenmiş sohbet ile fikirlerini paylaş.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="px-5 md:px-10 lg:px-40 py-12 md:py-16 lg:py-20">
        <p className="text-foreground text-lg md:text-xl lg:text-2xl font-roboto font-medium leading-relaxed md:leading-[40px]">
          Okumayan ve yazmayan insan düşünemez. (Ali Fuat Başgil,{" "}
          <span className="italic">Gençlerle Başbaşa</span>)
        </p>
      </section>
    </>
  );
}