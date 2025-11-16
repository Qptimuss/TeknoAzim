import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="bg-[#020303] text-white">
      {/* Hero Section */}
      <div className="relative h-[75vh] md:h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />

        {/* Gradient Overlay - Black at bottom, transparent at top */}
        <div className="absolute inset-0 h-full w-full bg-gradient-to-t from-[#020303] from-0% via-[#020303]/80 via-40% to-transparent to-100%" />

        {/* Content Container */}
        <div className="relative z-10 px-5 md:px-10 lg:px-20 pb-8 flex flex-col items-center pt-32">
          <div className="max-w-3xl text-center">
            <h1 className="font-outfit text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Fikirlerinizi Özgür Bırakın
            </h1>
            <p className="font-roboto text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Düşüncelerinizi, hikayelerinizi ve bilgilerinizi dünyayla paylaşın. Topluluğumuza katılın ve ilham verin.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="bg-white text-black hover:bg-gray-200">
                <Link to="/kaydol">
                  Hemen Başla
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="py-16 md:py-24 bg-[#090a0c]">
        <div className="container mx-auto px-5 md:px-10 lg:px-20 text-center">
          <blockquote className="max-w-3xl mx-auto">
            <p className="font-outfit text-2xl md:text-3xl font-medium text-gray-200 italic">
              "Okumayan ve yazmayan insan düşünemez."
            </p>
            <footer className="mt-4 font-roboto text-lg text-gray-400">
              - Ali Fuat Başgil, <cite>Gençlerle Başbaşa</cite>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Other sections can be added here */}
    </div>
  );
};

export default Index;