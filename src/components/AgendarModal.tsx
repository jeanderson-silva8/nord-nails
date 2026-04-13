import { useEffect, useRef, useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface AgendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgendarModal = ({ isOpen, onClose }: AgendarModalProps) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = () => {
    const personName = name.trim() || 'Cliente';
    const message = encodeURIComponent(
      `Olá! Tudo bem? Sou ${personName} e vim através do site de vocês.\n\nGostaria de agendar um atendimento de manicure. Qual a disponibilidade para os próximos dias?\n\nAgradeço desde já! 💅✨`
    );
    window.open(`https://wa.me/5561998000550?text=${message}`, '_blank');
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#2d2420]/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-md transform transition-all duration-500 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
      >
        {/* Decorative top border */}
        <div className="h-1.5 rounded-t-3xl bg-gradient-to-r from-[#c9a55c] via-[#c97d6a] to-[#c9a55c]" />

        <div className="bg-[#faf7f5] rounded-b-3xl shadow-2xl p-8 md:p-10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white border border-[#e8e0dc] flex items-center justify-center hover:bg-[#c97d6a] hover:border-[#c97d6a] hover:text-white transition-all duration-300 text-[#5a4a42]"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#c97d6a]/10 border border-[#c97d6a]/20 flex items-center justify-center">
              <Calendar size={26} className="text-[#c97d6a]" />
            </div>
            <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#c9a55c] block mb-2">
              Nord Nails
            </span>
            <h3 className="font-heading text-3xl text-[#2d2420] mb-2">
              Agende seu Horário
            </h3>
            <p className="font-body text-sm text-[#5a4a42]/80">
              Preencha seu nome e fale conosco diretamente pelo WhatsApp
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#e8e0dc]" />
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-[#b5a59d]">
              Seus dados
            </span>
            <div className="flex-1 h-px bg-[#e8e0dc]" />
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label
                htmlFor="agendar-name"
                className="block font-body text-xs uppercase tracking-[0.15em] font-medium text-[#2d2420] mb-2"
              >
                Seu nome:
              </label>
              <input
                ref={inputRef}
                id="agendar-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="Digite seu nome completo"
                className="w-full px-5 py-4 rounded-2xl border-2 border-[#e8e0dc] bg-white font-body text-[#2d2420] placeholder:text-[#b5a59d] focus:outline-none focus:border-[#c9a55c] focus:ring-2 focus:ring-[#c9a55c]/20 transition-all duration-300"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-body font-semibold text-sm uppercase tracking-[0.15em] transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] bg-[#c97d6a] hover:bg-[#b56a57]"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Agendar Via WhatsApp
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center">
            <p className="font-body text-[11px] text-[#b5a59d] italic">
              Você será redirecionado para o WhatsApp da Nord Nails
            </p>
          </div>

          {/* Decorative Corner Elements */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#c9a55c]/20 rounded-tl-lg pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#c9a55c]/20 rounded-br-lg pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default AgendarModal;
