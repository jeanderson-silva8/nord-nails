import { Instagram, Facebook, Phone, Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Serviços', href: '#servicos' },
    { label: 'Unidades', href: '#unidades' },
    { label: 'Inspiração', href: '#lookbook' },
    { label: 'Sobre Nós', href: '#sobre' },
    { label: 'Nossa Técnica', href: '#tecnica' },
    { label: 'Contato', href: '#contato' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#2d2420] text-white">
      {/* Main Footer */}
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="font-heading text-3xl tracking-wider mb-1">
                NORD NAILS
              </h3>
              <p className="font-body text-xs uppercase tracking-[0.3em] text-[#c97d6a]">
                Técnica Russa Original
              </p>
            </div>
            <p className="font-body text-sm text-white/70 leading-relaxed mb-6">
              Pioneira na técnica original russa de cutilagem e esmaltação no
              Brasil. Unhas impecáveis, experiência única.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/nordnailsbrasil/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c97d6a] transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/nordnailsbrasil"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#c97d6a] transition-colors"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] text-[#c97d6a] mb-6">
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="font-body text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] text-[#c97d6a] mb-6">
              Contato
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://wa.me/5561998000550"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-body text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-[#c97d6a]" />
                  (61) 99800-0550
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5561998000440"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-body text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-[#c97d6a]" />
                  (61) 99800-0440
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5511913017373"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-body text-sm text-white/70 hover:text-white transition-colors"
                >
                  <Phone size={16} className="text-[#c97d6a]" />
                  (11) 91301-7373
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-body text-xs uppercase tracking-[0.2em] text-[#c97d6a] mb-6">
              Funcionamento
            </h4>
            <ul className="space-y-3 font-body text-sm text-white/70">
              <li className="flex justify-between">
                <span>Seg - Sex</span>
                <span>08h às 21h</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado</span>
                <span>08h às 20h</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo</span>
                <span>10h às 14h*</span>
              </li>
            </ul>
            <p className="font-body text-xs text-white/50 mt-3">
              *Apenas unidade São Paulo
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-xs text-white/50">
              © {currentYear} Nord Nails. Todos os direitos reservados.
            </p>
            <p className="font-body text-xs text-white/50 flex items-center gap-1">
              Feito com <Heart size={12} className="text-[#c97d6a]" /> para
              mulheres especiais
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="font-body text-xs text-white/50 hover:text-white transition-colors"
              >
                Política de Privacidade
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() =>
            window.dispatchEvent(new Event('open-agendar-modal'))
          }
          className="w-14 h-14 bg-[#c97d6a] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#b56a57] hover:scale-110 transition-all"
          title="Agendar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
