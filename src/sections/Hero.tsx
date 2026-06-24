import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToServices = () => {
    const element = document.querySelector('#servicos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: `url('/images/img2.jpg')`,
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 xl:px-20 pt-32 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="w-2 h-2 bg-[#c9a55c] rounded-full animate-pulse" />
            <span className="font-body text-xs uppercase tracking-[0.3em] text-white/90">
              Pioneiros no Brasil
            </span>
          </div>

          {/* Main Title */}
          <h1
            className={`font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white leading-[1.1] mb-6 transition-all duration-1000 delay-200 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="block">Nord Nails</span>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-4 text-white/90">
              Técnica Russa Original
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`font-body text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-1000 delay-400 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            A única rede de salões no Brasil com a técnica original russa de
            cutilagem e esmaltação. Unhas impecáveis, durabilidade excepcional e
            uma experiência única de beleza.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-1000 delay-600 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <button
              onClick={() => {
                const element = document.querySelector('#unidades');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="btn-gold flex items-center gap-3 text-sm"
            >
              <Calendar size={18} />
              Agende seu Horário
            </button>
            <button
              onClick={scrollToServices}
              className="btn-outline border-white text-white hover:bg-white hover:text-[#2d2420] text-sm"
            >
              Conheça Nossos Serviços
            </button>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-8 max-w-2xl mx-auto transition-all duration-1000 delay-700 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="text-center">
              <div className="font-heading text-4xl md:text-5xl text-[#c9a55c] mb-2">
                5+
              </div>
              <div className="font-body text-xs uppercase tracking-[0.2em] text-white/70">
                Anos de Experiência
              </div>
            </div>
            <div className="text-center">
              <div className="font-heading text-4xl md:text-5xl text-[#c9a55c] mb-2">
                3
              </div>
              <div className="font-body text-xs uppercase tracking-[0.2em] text-white/70">
                Unidades
              </div>
            </div>
            <div className="text-center">
              <div className="font-heading text-4xl md:text-5xl text-[#c9a55c] mb-2">
                10k+
              </div>
              <div className="font-body text-xs uppercase tracking-[0.2em] text-white/70">
                Clientes Satisfeitas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-all duration-1000 delay-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={scrollToServices}
          className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <span className="font-body text-xs uppercase tracking-[0.2em]">
            Explore
          </span>
          <ChevronDown size={24} className="animate-bounce" />
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-px h-32 bg-gradient-to-b from-transparent via-white/30 to-transparent hidden lg:block" />
      <div className="absolute top-1/3 right-10 w-px h-48 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden lg:block" />
    </section>
  );
};

export default Hero;
