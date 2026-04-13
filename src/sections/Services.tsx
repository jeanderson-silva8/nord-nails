import { useEffect, useRef, useState } from 'react';
import { Clock, Sparkles, Calendar } from 'lucide-react';

interface Service {
  id: number;
  title: string;
  description: string;
  duration: string;
  image: string;
  featured?: boolean;
  objectPosition?: string;
}

const services: Service[] = [
  {
    id: 1,
    title: 'Manicure Completo em Técnica Russa',
    description:
      'Incluso remoção do gel nord, lixamento do formato da unha, cutilagem em técnica russa, esmaltação em gel e finalização com óleo nutritivo para cutículas e creme hidratante para as mãos.',
    duration: 'Até 2h',
    image: '/images/manicure-completo.webp',
    featured: true,
  },
  {
    id: 2,
    title: 'Pedicure Completo em Técnica Russa',
    description:
      'Remoção do gel Nord, lixamento do formato da unha, cutilagem em técnica russa e refinamento dos calcanhares (grau podologia básica), esmaltação em gel e finalização com óleo nutritivo.',
    duration: 'Até 2h',
    image: '/images/pedicure-completo.webp',
    featured: true,
  },
  {
    id: 3,
    title: 'Cutilagem de Mão',
    description:
      'Incluso remoção do gel nord, lixamento do formato da unha, cutilagem em técnica russa e finalização com óleo nutritivo para cutículas e creme hidratante para as mãos.',
    duration: 'Até 1h',
    image: '/images/cutilagem-mao.jpg',
  },
  {
    id: 4,
    title: 'Cutilagem de Pé',
    description:
      'Incluso remoção do gel nord, lixamento do formato da unha, cutilagem em técnica russa e refinamento dos calcanhares (grau podologia básica) e finalização com óleo nutritivo.',
    duration: 'Até 1h',
    image: '/images/cutilagem-pe.jpg',
    objectPosition: 'center 30%',
  },
  {
    id: 5,
    title: 'Design Elevado',
    description:
      'Inclui design de francesinha, degradê, mármore, pozinho, nail art e outros designs exclusivos. Tempo adicional para criar a arte perfeita.',
    duration: '+30 min',
    image: '/images/design-elevado.jpg',
  },
  {
    id: 6,
    title: 'Fortificação das Unhas',
    description:
      'Procedimento ideal para unhas danificadas, utilizando materiais especiais para fortalecer as unhas. Recomendado para unhas muito fracas enfraquecidas após remoção de alongamento',
    duration: 'Tempo adicional de 15 min',
    image: '/images/fortificacao-unhas.jpg',
  },
];

const Services = () => {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="servicos"
      ref={sectionRef}
      className="section-padding bg-cream"
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-subtitle">Nossos Serviços</span>
          <h2 className="section-title mb-6">
            Experiência Nord Nails
          </h2>
          <p className="font-body text-[#5a4a42] leading-relaxed">
            Cada serviço é realizado com a técnica russa original, garantindo
            unhas impecáveis, cutículas perfeitamente tratadas e uma esmaltação
            que dura semanas com o mesmo brilho do primeiro dia.
          </p>
        </div>

        {/* Featured Services */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {services
            .filter((s) => s.featured)
            .map((service, idx) => (
              <div
                key={service.id}
                ref={(el) => { cardRefs.current[idx] = el; }}
                data-index={idx}
                className={`group relative bg-white rounded-3xl overflow-hidden shadow-xl transition-all duration-700 ${
                  visibleCards.has(idx)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                {/* Image */}
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    style={service.objectPosition ? { objectPosition: service.objectPosition } : undefined}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#c9a55c] text-white text-xs font-body uppercase tracking-wider rounded-full">
                      <Sparkles size={12} />
                      Mais Popular
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="font-heading text-2xl md:text-3xl text-[#2d2420] mb-4">
                    {service.title}
                  </h3>
                  <p className="font-body text-[#5a4a42] text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#c97d6a]">
                      <Clock size={18} />
                      <span className="font-body text-sm">
                        {service.duration}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        window.dispatchEvent(new Event('open-agendar-modal'))
                      }
                      className="btn-primary text-xs py-3 px-6 flex items-center gap-2"
                    >
                      <Calendar size={16} />
                      Agendar
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Other Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services
            .filter((s) => !s.featured)
            .map((service, idx) => (
              <div
                key={service.id}
                ref={(el) => { cardRefs.current[idx + 2] = el; }}
                data-index={idx + 2}
                className={`group bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-700 hover:-translate-y-2 hover:shadow-xl ${
                  visibleCards.has(idx + 2)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${(idx + 2) * 150}ms` }}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    style={service.objectPosition ? { objectPosition: service.objectPosition } : undefined}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-heading text-xl text-[#2d2420] mb-3 line-clamp-2">
                    {service.title}
                  </h3>
                  <p className="font-body text-[#5a4a42] text-xs leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#c97d6a]">
                      <Clock size={14} />
                      <span className="font-body text-xs">
                        {service.duration}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        window.dispatchEvent(new Event('open-agendar-modal'))
                      }
                      className="text-[#c97d6a] font-body text-xs uppercase tracking-wider hover:text-[#b56a57] transition-colors"
                    >
                      Agendar →
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="font-body text-[#5a4a42] mb-6">
            Não encontrou o que procura? Entre em contato conosco.
          </p>
          <button
            onClick={() => {
              const element = document.querySelector('#contato');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-outline"
          >
            Fale Conosco
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
