import { useEffect, useRef, useState } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Lorena Baguiar',
    text: 'Sou cliente Nord há quase um ano e frequento a unidade Sudoeste. Desde quando conheci, nunca mais larguei! Minhas unhas ficam incríveis e impecáveis, não quebram de jeito nenhum, as cutículas crescem bem pouco, as cores e os designs são maravilhosos e sempre fazem sucesso!',
    rating: 5,
    location: 'Brasília - Sudoeste',
  },
  {
    id: 2,
    name: 'Karine Carvalho',
    text: 'A Nord é um caso de amor à primeira vista! Desde então, nunca mais larguei. Unhas sempre impecáveis e com brilho único. A técnica russa realmente faz toda a diferença, minhas cutículas nunca estiveram tão bem cuidadas.',
    rating: 5,
    location: 'São Paulo',
  },
  {
    id: 3,
    name: 'Ana Paula Mendes',
    text: 'Experimentei vários salões em Brasília antes de encontrar a Nord Nails. A diferença é absurda! A durabilidade da esmaltação, o cuidado com as cutículas, o atendimento... tudo é impecável. Recomendo de olhos fechados!',
    rating: 5,
    location: 'Brasília - Lago Sul',
  },
  {
    id: 4,
    name: 'Mariana Costa',
    text: 'Vim de São Paulo especificamente para conhecer a técnica russa na Nord Nails. Valeu cada minuto da viagem! Agora não consigo mais fazer em outro lugar. A qualidade é incomparável.',
    rating: 5,
    location: 'São Paulo',
  },
  {
    id: 5,
    name: 'Fernanda Lima',
    text: 'Como médica, preciso de unhas que durem semanas sem descascar ou perder o brilho. A Nord Nails entrega exatamente isso! Além disso, o ambiente é super agradável e as profissionais são extremamente capacitadas.',
    rating: 5,
    location: 'Brasília - Sudoeste',
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section ref={sectionRef} className="section-padding bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-subtitle">Depoimentos</span>
          <h2 className="section-title mb-6">O Que Dizem Nossas Clientes</h2>
          <p className="font-body text-[#5a4a42] leading-relaxed">
            A satisfação das nossas clientes é o nosso maior orgulho. Confira
            alguns depoimentos de quem já experimentou a técnica russa original.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div
          className={`relative max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Main Card */}
          <div className="relative bg-cream rounded-3xl p-8 md:p-12 shadow-xl">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8 w-12 h-12 bg-[#c97d6a] rounded-full flex items-center justify-center">
              <Quote size={24} className="text-white" />
            </div>

            {/* Content */}
            <div className="pt-4">
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className="text-[#c9a55c] fill-[#c9a55c]"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="font-body text-lg md:text-xl text-[#2d2420] leading-relaxed mb-8 italic">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-xl text-[#2d2420]">
                    {testimonials[currentIndex].name}
                  </p>
                  <p className="font-body text-sm text-[#5a4a42]">
                    {testimonials[currentIndex].location}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={prevTestimonial}
                    className="w-12 h-12 rounded-full border border-[#2d2420]/20 flex items-center justify-center text-[#2d2420] hover:bg-[#2d2420] hover:text-white transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="w-12 h-12 rounded-full border border-[#2d2420]/20 flex items-center justify-center text-[#2d2420] hover:bg-[#2d2420] hover:text-white transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 bg-[#c97d6a]'
                    : 'bg-[#2d2420]/20 hover:bg-[#2d2420]/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 transition-all duration-1000 delay-300 ${
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          }`}
        >
          {[
            { value: '10k+', label: 'Clientes Satisfeitas' },
            { value: '50k+', label: 'Procedimentos Realizados' },
            { value: '4.9', label: 'Avaliação Média' },
            { value: '95%', label: 'Taxa de Retorno' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="font-heading text-4xl md:text-5xl text-[#c97d6a] mb-2">
                {stat.value}
              </p>
              <p className="font-body text-xs uppercase tracking-[0.2em] text-[#5a4a42]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
