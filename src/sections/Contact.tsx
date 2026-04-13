import { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  Send,
  CheckCircle,
} from 'lucide-react';

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
  },
];

const Contact = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    privacy: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
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
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        privacy: false,
      });
    }, 3000);
  };

  return (
    <section id="contato" ref={sectionRef} className="section-padding bg-cream">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-subtitle">Fale Conosco</span>
          <h2 className="section-title mb-6">Contato</h2>
          <p className="font-body text-[#5a4a42] leading-relaxed">
            Interessada em conhecer nossa técnica russa? Queremos que sua
            experiência seja memorável. Entre em contato conosco.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Contact Form */}
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl">
              <h3 className="font-heading text-2xl text-[#2d2420] mb-6">
                Envie uma mensagem
              </h3>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h4 className="font-heading text-xl text-[#2d2420] mb-2">
                    Mensagem Enviada!
                  </h4>
                  <p className="font-body text-sm text-[#5a4a42]">
                    Agradecemos seu contato. Retornaremos em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <input
                        type="text"
                        placeholder="Nome"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="form-input"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="E-mail"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <input
                        type="tel"
                        placeholder="Telefone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="form-input"
                      />
                    </div>
                    <div>
                      <select
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="form-input"
                      >
                        <option value="">Assunto</option>
                        <option value="elogio">Elogios</option>
                        <option value="sugestao">Sugestões</option>
                        <option value="reclamacao">Reclamação</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      placeholder="Escreva sua mensagem"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="form-input resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacy"
                      required
                      checked={formData.privacy}
                      onChange={(e) =>
                        setFormData({ ...formData, privacy: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 rounded border-[#e8e0dc] text-[#c97d6a] focus:ring-[#c97d6a]"
                    />
                    <label
                      htmlFor="privacy"
                      className="font-body text-xs text-[#5a4a42] leading-relaxed"
                    >
                      Ao confirmar, você autoriza a Nord Nails a armazenar e
                      processar os dados pessoais preenchidos para a finalidade
                      informada. Para saber mais, acesse nossa{' '}
                      <a
                        href="#"
                        className="text-[#c97d6a] hover:underline"
                      >
                        Política de Privacidade
                      </a>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Enviar Mensagem
                  </button>
                </form>
              )}
            </div>

            {/* Social Links */}
            <div className="mt-8 flex justify-center gap-6">
              <a
                href="https://www.instagram.com/nordnailsbrasil/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-[#2d2420] hover:bg-[#c97d6a] hover:text-white transition-all"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://www.facebook.com/nordnailsbrasil"
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-[#2d2420] hover:bg-[#c97d6a] hover:text-white transition-all"
              >
                <Facebook size={24} />
              </a>
            </div>
          </div>

          {/* Locations Info */}
          <div
            className={`space-y-6 transition-all duration-1000 delay-200 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-12'
            }`}
          >
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <h4 className="font-heading text-xl text-[#2d2420] mb-4">
                  {location.name}
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#c97d6a] mt-0.5 flex-shrink-0" />
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-[#5a4a42] hover:text-[#c97d6a] transition-colors"
                    >
                      {location.address}
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-[#c97d6a] flex-shrink-0" />
                    <a
                      href={`https://wa.me/${location.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-[#5a4a42] hover:text-[#c97d6a] transition-colors"
                    >
                      {location.phone}
                    </a>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-[#c9a55c] mt-0.5 flex-shrink-0" />
                    <div className="font-body text-sm text-[#5a4a42]">
                      <p>
                        <span className="text-[#5a4a42]/70">Seg - Sex:</span>{' '}
                        {location.hours.weekday}
                      </p>
                      <p>
                        <span className="text-[#5a4a42]/70">Sábado:</span>{' '}
                        {location.hours.saturday}
                      </p>
                      <p>
                        <span className="text-[#5a4a42]/70">Domingo:</span>{' '}
                        {location.hours.sunday}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e8e0dc] flex gap-3">
                  <button
                    onClick={() =>
                      window.dispatchEvent(new Event('open-agendar-modal'))
                    }
                    className="flex-1 btn-primary text-xs py-2.5"
                  >
                    Agendar
                  </button>
                  <a
                    href={location.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 border border-[#2d2420]/20 rounded-full font-body text-xs uppercase tracking-wider text-[#2d2420] hover:bg-[#2d2420] hover:text-white transition-all"
                  >
                    Ver Mapa
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
