import { useState, useEffect } from 'react';
import { Menu, X, Instagram, Facebook } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#servicos', label: 'Serviços' },
    { href: '#unidades', label: 'Unidades' },
    { href: '#lookbook', label: 'Inspiração' },
    { href: '#sobre', label: 'Sobre Nós' },
    { href: '#tecnica', label: 'Nossa Técnica' },
    { href: '#contato', label: 'Contato' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-3'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col items-center"
            >
              <span
                className={`font-heading text-2xl md:text-3xl font-medium tracking-wider transition-colors duration-300 ${
                  isScrolled ? 'text-[#2d2420]' : 'text-white'
                }`}
              >
                NORD NAILS
              </span>
              <span
                className={`text-[10px] uppercase tracking-[0.4em] transition-colors duration-300 ${
                  isScrolled ? 'text-[#c97d6a]' : 'text-white/80'
                }`}
              >
                Técnica Russa
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className={`font-body text-xs uppercase tracking-[0.2em] relative group transition-colors duration-300 ${
                    isScrolled
                      ? 'text-[#2d2420] hover:text-[#c97d6a]'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${
                      isScrolled ? 'bg-[#c97d6a]' : 'bg-white'
                    }`}
                  />
                </button>
              ))}
            </nav>

            {/* Social Icons & CTA - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <a
                href="https://www.instagram.com/nordnailsbrasil/"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors duration-300 ${
                  isScrolled
                    ? 'text-[#2d2420] hover:text-[#c97d6a]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.facebook.com/nordnailsbrasil"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors duration-300 ${
                  isScrolled
                    ? 'text-[#2d2420] hover:text-[#c97d6a]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Facebook size={20} />
              </a>
              <button
                onClick={() =>
                  window.dispatchEvent(new Event('open-agendar-modal'))
                }
                className="btn-primary text-xs py-3 px-6"
              >
                Agendar
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 transition-colors duration-300 ${
                isScrolled ? 'text-[#2d2420]' : 'text-white'
              }`}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl transition-transform duration-500 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full pt-24 pb-8 px-8">
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="font-body text-sm uppercase tracking-[0.2em] text-[#2d2420] hover:text-[#c97d6a] text-left transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto">
              <div className="flex gap-6 mb-8">
                <a
                  href="https://www.instagram.com/nordnailsbrasil/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2d2420] hover:text-[#c97d6a] transition-colors"
                >
                  <Instagram size={24} />
                </a>
                <a
                  href="https://www.facebook.com/nordnailsbrasil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2d2420] hover:text-[#c97d6a] transition-colors"
                >
                  <Facebook size={24} />
                </a>
              </div>
              <button
                onClick={() =>
                  window.dispatchEvent(new Event('open-agendar-modal'))
                }
                className="btn-primary w-full text-center"
              >
                Agendar Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
