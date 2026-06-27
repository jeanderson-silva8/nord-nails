import { useEffect, useRef, useState } from 'react';
import { X, Calendar, Phone, Clock, MapPin, User, AlertCircle, CheckCircle } from 'lucide-react';
import { locations } from '../sections/Locations';
import type { Location } from '../sections/Locations';
import { supabase } from '../lib/supabase';

// API do Cloudflare Turnstile carregada via <script> no index.html.
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined;

interface AgendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation: Location | null;
}

const AgendarModal = ({ isOpen, onClose, initialLocation }: AgendarModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [selectedLocationId, setSelectedLocationId] = useState<number>(
    initialLocation?.id || locations[0].id
  );

  // Estados para gerenciar os limites, agendamentos do dia selecionado e tela de sucesso
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Incrementado para forçar uma releitura da disponibilidade (ex.: após o
  // servidor recusar por turno cheio numa corrida).
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Token do CAPTCHA (Turnstile). Exigido só quando a site key está configurada.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Define a data mínima como hoje para evitar agendamentos no passado
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Sincroniza a localização selecionada quando o modal abre com uma localização específica
  useEffect(() => {
    if (initialLocation) {
      setSelectedLocationId(initialLocation.id);
    }
  }, [initialLocation, isOpen]);

  // Encontra a localização ativa com base no id selecionado
  const activeLocation =
    locations.find((loc) => loc.id === selectedLocationId) || locations[0];

  // Busca os agendamentos existentes no banco de dados para a data e unidade selecionadas
  useEffect(() => {
    const fetchBookings = async () => {
      if (!date) return;
      setIsLoadingSlots(true);
      try {
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from('vagas_ocupadas')
            .select('horario')
            .eq('unidade', activeLocation.name)
            .eq('dia', date);

          if (error) {
            console.error('Erro ao buscar agendamentos:', error.message);
          } else {
            setDayBookings(data || []);
          }
        }
      } catch (err) {
        console.error('Erro de conexão ao buscar agendamentos:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    if (isOpen && date) {
      fetchBookings();
    } else {
      setDayBookings([]);
    }
  }, [date, selectedLocationId, isOpen, activeLocation.name, refreshTrigger]);

  // Renderiza o CAPTCHA (Turnstile) quando o formulário está visível.
  useEffect(() => {
    if (!turnstileSiteKey || !isOpen || isSuccess) return;

    let cancelled = false;
    // O script do Turnstile carrega async; espera ele ficar disponível.
    const tryRender = () => {
      if (cancelled) return;
      const el = turnstileRef.current;
      if (window.turnstile && el && turnstileWidgetId.current === null) {
        turnstileWidgetId.current = window.turnstile.render(el, {
          sitekey: turnstileSiteKey,
          callback: (token) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(null),
          'error-callback': () => setCaptchaToken(null),
          theme: 'light',
        });
      } else if (!window.turnstile) {
        setTimeout(tryRender, 200);
      }
    };
    tryRender();

    return () => {
      cancelled = true;
      if (window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.remove(turnstileWidgetId.current);
      }
      turnstileWidgetId.current = null;
      setCaptchaToken(null);
    };
  }, [isOpen, isSuccess]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && !isSuccess) {
      setTimeout(() => inputRef.current?.focus(), 200);
      document.body.style.overflow = 'hidden';
    } else if (isOpen && isSuccess) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isSuccess]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  // Reseta o modal ao fechar
  const handleClose = () => {
    setName('');
    setPhone('');
    setDate('');
    setTime('09:00');
    setIsSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  // Função para formatar o telefone enquanto o usuário digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numbers = input.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);

    let formatted = '';
    if (limited.length > 0) {
      if (limited.length <= 2) {
        formatted = `(${limited}`;
      } else if (limited.length <= 7) {
        formatted = `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
      } else {
        formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
      }
    }
    setPhone(formatted);
  };

  // Identifica o turno de um determinado horário
  // Manhã: das 09:00 até as 12:00 | Tarde: das 12:30 até as 18:30
  const getTurno = (horario: string): 'manha' | 'tarde' => {
    const [hours, minutes] = horario.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const limit12 = 12 * 60; // 12:00h = 720 minutos
    return totalMinutes <= limit12 ? 'manha' : 'tarde';
  };

  // Conta os agendamentos já existentes em cada turno para o dia e unidade ativos
  const countManha = dayBookings.filter((b) => getTurno(b.horario) === 'manha').length;
  const countTarde = dayBookings.filter((b) => getTurno(b.horario) === 'tarde').length;

  const maxManha = 3;
  const maxTarde = 5;

  const isManhaCheia = countManha >= maxManha;
  const isTardeCheia = countTarde >= maxTarde;

  // Verifica se o horário selecionado atualmente está em um turno que já esgotou
  const currentTurno = getTurno(time);
  const isSelectedTurnoFull =
    (currentTurno === 'manha' && isManhaCheia) ||
    (currentTurno === 'tarde' && isTardeCheia);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }
    
    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length !== 11) {
      alert('Por favor, informe um telefone válido com DDD (11 dígitos).');
      return;
    }
    
    if (!date) {
      alert('Por favor, escolha o dia do agendamento.');
      return;
    }

    // UX: barra cedo o turno que JÁ aparece cheio na tela, pra cliente não
    // perder tempo. NÃO é a barreira de segurança — quem decide é o servidor.
    if (isSelectedTurnoFull) {
      alert(
        `Desculpe, o turno da ${
          currentTurno === 'manha' ? 'manhã (máximo 3)' : 'tarde (máximo 5)'
        } nesta data já está cheio. Por favor, escolha outro horário ou dia.`
      );
      return;
    }

    // Exige o CAPTCHA quando configurado (token é validado no servidor).
    if (turnstileSiteKey && !captchaToken) {
      alert('Por favor, conclua a verificação de segurança (anti-robô).');
      return;
    }

    // Reseta o widget para o próximo envio (o token do Turnstile é de uso único).
    const resetCaptcha = () => {
      if (turnstileSiteKey && window.turnstile && turnstileWidgetId.current !== null) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setCaptchaToken(null);
    };

    setIsSubmitting(true);

    try {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // O navegador NÃO grava mais direto na tabela. Toda escrita passa pela
        // Edge Function `criar-agendamento`, que valida o CAPTCHA, revalida os
        // dados e insere com a service_role. O trigger ainda garante o limite.
        const { data, error } = await supabase.functions.invoke(
          'criar-agendamento',
          {
            body: {
              unidade: activeLocation.name,
              nome: name.trim(),
              telefone: phone.trim(),
              dia: date,
              horario: time,
              captchaToken,
            },
          }
        );

        if (error || !data?.ok) {
          const code = data?.code as string | undefined;
          if (code === 'LIMITE_TURNO_ATINGIDO') {
            alert(
              'Essa vaga acabou de ser preenchida. O turno selecionado nesta data está cheio. Por favor, escolha outro horário ou dia.'
            );
            setRefreshTrigger((prev) => prev + 1);
          } else if (code === 'CAPTCHA_AUSENTE' || code === 'CAPTCHA_INVALIDO') {
            alert('Falha na verificação de segurança. Por favor, tente novamente.');
          } else if (code === 'TELEFONE_INVALIDO') {
            alert('Telefone inválido. Informe um número com DDD (11 dígitos).');
          } else if (code === 'DATA_INVALIDA') {
            alert('Data inválida. Escolha uma data a partir de hoje.');
          } else {
            console.error('Erro ao registrar agendamento:', error?.message || code);
            alert('Houve um erro ao registrar o agendamento. Por favor, tente novamente.');
          }
          resetCaptcha();
          setIsSubmitting(false);
        } else {
          // Em vez de abrir o WhatsApp, altera para o estado de sucesso
          setIsSuccess(true);
        }
      } else {
        // As variáveis VITE_SUPABASE_* não entraram no build (ex.: faltam no
        // painel da Vercel). Sem elas NÃO há como gravar — então mostramos um
        // erro de verdade em vez de uma falsa tela de sucesso que esconde o
        // problema e faz o agendamento "sumir".
        console.error(
          'Supabase não configurado: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no build. ' +
            'Configure as variáveis de ambiente (local: .env | produção: painel da Vercel) e refaça o deploy.'
        );
        alert(
          'O sistema de agendamentos não está configurado no momento. ' +
            'Por favor, entre em contato pelo WhatsApp para concluir seu agendamento.'
        );
        resetCaptcha();
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Erro de conexão com o servidor:', err);
      alert('Erro de conexão com o servidor. Por favor, verifique a internet.');
      resetCaptcha();
      setIsSubmitting(false);
    }
  };

  // Gera os horários das 9h às 18h30 (de 30 em 30 minutos)
  const availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', 
    '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#2d2420]/75 backdrop-blur-md" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg transform transition-all duration-500 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
      >
        {/* Decorative top border */}
        <div className="h-2 rounded-t-3xl bg-gradient-to-r from-[#c9a55c] via-[#c97d6a] to-[#c9a55c]" />

        <div className="bg-[#faf7f5] rounded-b-3xl shadow-2xl p-6 sm:p-8 md:p-10 max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white border border-[#e8e0dc] flex items-center justify-center hover:bg-[#c97d6a] hover:border-[#c97d6a] hover:text-white transition-all duration-300 text-[#5a4a42] z-10"
          >
            <X size={18} />
          </button>

          {/* Renderização Condicional: Sucesso vs Formulário */}
          {isSuccess ? (
            /* Tela de Sucesso */
            <div className="text-center py-6 sm:py-8 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-green-500 animate-bounce">
                <CheckCircle size={44} />
              </div>
              <span className="font-body text-xs uppercase tracking-[0.3em] text-[#c9a55c] block mb-2">
                Nord Nails
              </span>
              <h3 className="font-heading text-2xl text-[#2d2420] mb-4">
                Seu agendamento foi concluído com sucesso.
              </h3>
              
              <div className="max-w-md mx-auto space-y-4 font-body text-sm text-[#5a4a42] leading-relaxed">
                <p>
                  Tudo certo, <strong className="text-[#2d2420]">{name}</strong>! Seus dados foram salvos no nosso sistema de agendamentos.
                </p>
                <p className="bg-[#c97d6a]/10 border border-[#c97d6a]/10 rounded-2xl p-4 text-xs text-[#2d2420] mt-4 flex items-start gap-2.5 text-left">
                  <MapPin className="text-[#c97d6a] flex-shrink-0 mt-0.5" size={16} />
                  <span>
                    Unidade escolhida: <strong>{activeLocation.name}</strong>
                    <br />
                    <span className="text-[#5a4a42]/85">{activeLocation.address}</span>
                  </span>
                </p>
                <p className="text-xs text-[#5a4a42]/90 italic pt-2">
                  Em instantes, um de nossos assistentes enviará uma mensagem de confirmação diretamente no seu WhatsApp.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full mt-8 py-4 px-6 rounded-2xl text-white font-body font-semibold text-sm uppercase tracking-[0.15em] transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] bg-[#c97d6a] hover:bg-[#b56a57]"
              >
                Entendido
              </button>
            </div>
          ) : (
            /* Tela do Formulário Principal */
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#c97d6a]/10 border border-[#c97d6a]/20 flex items-center justify-center">
                  <Calendar size={24} className="text-[#c97d6a]" />
                </div>
                <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#c9a55c] block mb-1">
                  Nord Nails
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl text-[#2d2420] mb-1">
                  Agende seu Horário
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#5a4a42]/80">
                  Preencha os dados abaixo para verificar a disponibilidade de horários
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Unidade */}
                {!initialLocation ? (
                  <div>
                    <label className="block font-body text-xs uppercase tracking-[0.15em] font-semibold text-[#2d2420] mb-2 flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#c97d6a]" />
                      Escolha a Unidade:
                    </label>
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e8e0dc] bg-white font-body text-[#2d2420] focus:outline-none focus:border-[#c97d6a] focus:ring-2 focus:ring-[#c97d6a]/10 transition-all duration-300"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {/* Nome */}
                <div>
                  <label
                    htmlFor="agendar-name"
                    className="block font-body text-xs uppercase tracking-[0.15em] font-semibold text-[#2d2420] mb-2 flex items-center gap-1.5"
                  >
                    <User size={14} className="text-[#c97d6a]" />
                    Seu Nome:
                  </label>
                  <input
                    ref={inputRef}
                    id="agendar-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e8e0dc] bg-white font-body text-[#2d2420] placeholder:text-[#b5a59d] focus:outline-none focus:border-[#c97d6a] focus:ring-2 focus:ring-[#c97d6a]/10 transition-all duration-300"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label
                    htmlFor="agendar-phone"
                    className="block font-body text-xs uppercase tracking-[0.15em] font-semibold text-[#2d2420] mb-2 flex items-center gap-1.5"
                  >
                    <Phone size={14} className="text-[#c97d6a]" />
                    Telefone de Contato:
                  </label>
                  <input
                    id="agendar-phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e8e0dc] bg-white font-body text-[#2d2420] placeholder:text-[#b5a59d] focus:outline-none focus:border-[#c97d6a] focus:ring-2 focus:ring-[#c97d6a]/10 transition-all duration-300"
                  />
                </div>

                {/* Dia e Horário em duas colunas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dia */}
                  <div>
                    <label
                      htmlFor="agendar-date"
                      className="block font-body text-xs uppercase tracking-[0.15em] font-semibold text-[#2d2420] mb-2 flex items-center gap-1.5"
                    >
                      <Calendar size={14} className="text-[#c97d6a]" />
                      Dia do Atendimento:
                    </label>
                    <input
                      id="agendar-date"
                      type="date"
                      min={minDate}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e8e0dc] bg-white font-body text-[#2d2420] focus:outline-none focus:border-[#c97d6a] focus:ring-2 focus:ring-[#c97d6a]/10 transition-all duration-300"
                    />
                  </div>

                  {/* Horário */}
                  <div>
                    <label
                      htmlFor="agendar-time"
                      className="block font-body text-xs uppercase tracking-[0.15em] font-semibold text-[#2d2420] mb-2 flex items-center gap-1.5"
                    >
                      <Clock size={14} className="text-[#c97d6a]" />
                      Horário Desejado:
                    </label>
                    <select
                      id="agendar-time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#e8e0dc] bg-white font-body text-[#2d2420] focus:outline-none focus:border-[#c97d6a] focus:ring-2 focus:ring-[#c97d6a]/10 transition-all duration-300"
                    >
                      {availableTimes.map((t) => {
                        const tTurno = getTurno(t);
                        const isTurnoFull = (tTurno === 'manha' && isManhaCheia) || (tTurno === 'tarde' && isTardeCheia);
                        return (
                          <option key={t} value={t} disabled={isTurnoFull} className={isTurnoFull ? 'text-[#b5a59d] line-through' : ''}>
                            {t} {isTurnoFull ? '(Esgotado)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Informações adicionais de Vagas e Alertas */}
                {date && !isLoadingSlots && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#e8e0dc] space-y-2">
                    <p className="font-body text-[11px] text-[#5a4a42] uppercase tracking-wider font-semibold">
                      Vagas para este Dia nesta Unidade:
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className={`p-2 rounded-lg ${isManhaCheia ? 'bg-red-50 text-red-700' : 'bg-[#faf7f5] text-[#2d2420]'}`}>
                        <span className="font-medium">Manhã (09h-12h):</span> {countManha}/{maxManha} vagas
                        {isManhaCheia && <span className="block text-[9px] text-red-500 font-semibold mt-0.5">ESGOTADO</span>}
                      </div>
                      <div className={`p-2 rounded-lg ${isTardeCheia ? 'bg-red-50 text-red-700' : 'bg-[#faf7f5] text-[#2d2420]'}`}>
                        <span className="font-medium">Tarde (12h30-18h30):</span> {countTarde}/{maxTarde} vagas
                        {isTardeCheia && <span className="block text-[9px] text-red-500 font-semibold mt-0.5">ESGOTADO</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aviso em Tempo Real se o Turno Selecionado Estiver Cheio */}
                {date && isSelectedTurnoFull && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200/50 flex items-start gap-2.5 animate-pulse">
                    <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-body text-xs font-semibold text-red-800">
                        Limite de Vagas Atingido
                      </p>
                      <p className="font-body text-[11px] text-red-700 mt-0.5">
                        O turno da {currentTurno === 'manha' ? 'manhã' : 'tarde'} já atingiu o limite máximo de agendamentos ({currentTurno === 'manha' ? 'máximo 3' : 'máximo 5'} por dia). Por favor, selecione outro horário/turno ou outra data.
                      </p>
                    </div>
                  </div>
                )}

                {/* Destaque da Localização */}
                <div className="p-4 rounded-2xl bg-[#c97d6a]/10 border border-[#c97d6a]/20 flex items-start gap-3">
                  <MapPin className="text-[#c97d6a] mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-body text-xs text-[#5a4a42] uppercase tracking-wider font-medium">
                      Informação do Local
                    </p>
                    <p className="font-body text-[13px] text-[#2d2420] mt-0.5">
                      Você está agendando na localização{' '}
                      <strong className="text-[#c97d6a] font-semibold">
                        {activeLocation.name}
                      </strong>
                    </p>
                    <p className="font-body text-[11px] text-[#5a4a42]/80 mt-0.5">
                      {activeLocation.address}
                    </p>
                  </div>
                </div>

                {/* CAPTCHA anti-spam (renderizado pelo Turnstile quando configurado) */}
                {turnstileSiteKey && (
                  <div ref={turnstileRef} className="flex justify-center" />
                )}

                {/* Botão de Enviar */}
                <button
                  onClick={handleSubmit}
                  disabled={
                    isSelectedTurnoFull ||
                    isSubmitting ||
                    (!!turnstileSiteKey && !captchaToken)
                  }
                  className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-body font-semibold text-sm uppercase tracking-[0.15em] transition-all duration-300 ${
                    isSelectedTurnoFull || isSubmitting || (!!turnstileSiteKey && !captchaToken)
                      ? 'bg-[#b5a59d] cursor-not-allowed opacity-60'
                      : 'hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] bg-[#c97d6a] hover:bg-[#b56a57]'
                  } mt-4`}
                >
                  {isSubmitting ? (
                    <span>Processando Agendamento...</span>
                  ) : (
                    <>
                      <Calendar size={16} />
                      {isSelectedTurnoFull ? 'Horário Indisponível' : 'Confirmar Agendamento'}
                    </>
                  )}
                </button>
              </div>

              {/* Footer note */}
              <div className="mt-5 text-center">
                <p className="font-body text-[10px] text-[#b5a59d] italic">
                  Seu agendamento será processado e confirmado em nosso sistema de forma imediata
                </p>
              </div>
            </>
          )}

          {/* Decorative Corner Elements */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#c9a55c]/20 rounded-tl-lg pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#c9a55c]/20 rounded-br-lg pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default AgendarModal;
