import { useEffect, useRef, useState } from 'react';
import { MapPin, Phone, Clock, Calendar, ExternalLink } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  mapUrl: string;
  image: string;
}

const locations: Location[] = [
  {
    id: 1,
    name: 'Brasília - Lago Sul',
    address: 'Lago Sul, SHIS Qi 9/11, Bloco L loja 4',
    phone: '(61) 99800-0550',
    whatsapp: '5561998000550',
    hours: {
      weekday: '08h às 21h',
      saturday: '08h às 16h',
      sunday: 'Fechado',
    },
    mapUrl: 'https://maps.app.goo.gl/f2hiHHyFi9trXqvb6',
    image: '/images/img5.jpg',
  },
  {
    id: 2,
    name: 'Brasília - Sudoeste',
    address: 'Sudoeste, CCSW 1, Edifício Portal Master bloco B2 loja 7',
    phone: '(61) 99800-0440',
    whatsapp: '5561998000440',
    hours: {
      weekday: '08h às 21h',
      saturday: '08h às 16h',
      sunday: 'Fechado',
    },
    mapUrl: 'https://maps.app.goo.gl/1WgAn1Mgp1qwu5A49',
    image: '/images/img6.jpg',
  },
  {
    id: 3,
    name: 'São Paulo',
    address: 'Rua Haddock Lobo, 1421, loja 4',
    phone: '(11) 91301-7373',
    whatsapp: '5511913017373',
    hours: {
      weekday: '08h às 20h',
      saturday: '08h às 20h',
      sunday: '10h às 14h',
    },
    mapUrl: 'https://maps.app.goo.gl/XV7kzKUS1eBo16Jh7',
    image: '/images/img7.jpg',
  },
];

const Locations = () => {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
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
    <section id="unidades" className="section-padding bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-subtitle">Onde Estamos</span>
          <h2 className="section-title mb-6">Nossas Unidades</h2>
          <p className="font-body text-[#5a4a42] leading-relaxed">
            Visite a unidade mais próxima de você e experimente a técnica russa
            original. Ambientes pensados para o seu conforto e bem-estar.
          </p>
        </div>

        {/* Locations Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {locations.map((location, idx) => (
            <div
              key={location.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              data-index={idx}
              className={`group relative bg-cream rounded-3xl overflow-hidden transition-all duration-700 ${
                visibleCards.has(idx)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${idx * 200}ms` }}
              onMouseEnter={() => setSelectedLocation(location.id)}
              onMouseLeave={() => setSelectedLocation(null)}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2420]/80 via-[#2d2420]/20 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="font-heading text-2xl text-white mb-1">
                    {location.name}
                  </h3>
                  <div className="flex items-center gap-2 text-white/80">
                    <MapPin size={14} />
                    <span className="font-body text-xs">{location.address}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Phone */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#c97d6a]/10 flex items-center justify-center">
                    <Phone size={18} className="text-[#c97d6a]" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-[#5a4a42] uppercase tracking-wider">
                      Telefone
                    </p>
                    <a
                      href={`https://wa.me/${location.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-[#2d2420] hover:text-[#c97d6a] transition-colors"
                    >
                      {location.phone}
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#c9a55c]/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-[#c9a55c]" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-[#5a4a42] uppercase tracking-wider mb-2">
                      Horário de Funcionamento
                    </p>
                    <div className="space-y-1">
                      <p className="font-body text-xs text-[#2d2420]">
                        <span className="text-[#5a4a42]">Seg - Sex:</span>{' '}
                        {location.hours.weekday}
                      </p>
                      <p className="font-body text-xs text-[#2d2420]">
                        <span className="text-[#5a4a42]">Sábado:</span>{' '}
                        {location.hours.saturday}
                      </p>
                      <p className="font-body text-xs text-[#2d2420]">
                        <span className="text-[#5a4a42]">Domingo:</span>{' '}
                        {location.hours.sunday}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      window.dispatchEvent(new Event('open-agendar-modal'))
                    }
                    className="flex-1 btn-primary text-xs py-3 px-4 flex items-center justify-center gap-2"
                  >
                    <Calendar size={14} />
                    Agendar
                  </button>
                  <a
                    href={location.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-[#2d2420]/20 rounded-full font-body text-xs uppercase tracking-wider text-[#2d2420] hover:bg-[#2d2420] hover:text-white transition-all"
                  >
                    <ExternalLink size={14} />
                    Ver Mapa
                  </a>
                </div>
              </div>

              {/* Hover Effect Border */}
              <div
                className={`absolute inset-0 border-2 border-[#c97d6a] rounded-3xl transition-opacity duration-300 pointer-events-none ${
                  selectedLocation === location.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Map Embed */}
        <div className="mt-16 rounded-3xl overflow-hidden shadow-xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3839.2!2d-47.9!3d-15.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDQ4JzAwLjAiUyA0N8KwNTQnMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1600000000000!5m2!1spt-BR!2sbr"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="grayscale-[20%] hover:grayscale-0 transition-all duration-500"
            title="Nord Nails Locations"
          />
        </div>
      </div>
    </section>
  );
};

export default Locations;
