import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Calendar, Check } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: 'O que é técnica russa?',
    answer:
      'A técnica russa é um método de manicure e pedicure que não utiliza instrumentos de corte como alicates. Em vez disso, utiliza aparelhos de podologia e brocas especiais importadas para fazer a cutilagem de forma delicada e segura, sem perigo de cortes profundos e machucados.',
  },
  {
    id: 2,
    question: 'É alongamento? Fazem alongamento?',
    answer:
      'Não, não trabalhamos com alongamento. Nossa especialidade é a cutilagem e esmaltação em gel na unha natural. O método Nord de esmaltação em gel possibilita que a unha natural fique protegida e cresça do tamanho desejado sem quebrar e sem precisar de alongamento.',
  },
  {
    id: 3,
    question: 'Quanto tempo dura?',
    answer:
      'Nossa esmaltação em gel dura em média 2 a 3 semanas mantendo o brilho e a aparência impecável. A técnica russa de cutilagem faz com que a cutícula cresça cada vez mais fina e lentamente, prolongando o resultado.',
  },
  {
    id: 4,
    question: 'Não usa alicate? Então não tira cutícula?',
    answer:
      'A técnica russa remove a cutícula sim, mas de forma diferente e mais segura. Utilizamos aparelhos de podologia e brocas especiais importadas que removem a cutícula de forma delicada, sem cortes e sem machucados. O resultado é uma cutilagem mais profunda e duradoura.',
  },
  {
    id: 5,
    question: 'Quanto tempo demora o procedimento?',
    answer:
      'O tempo varia de acordo com o serviço escolhido. A cutilagem de mão ou pé dura até 1 hora. O manicure ou pedicure completo em técnica russa dura até 2 horas. Designs elevados adicionam cerca de 30 minutos ao procedimento.',
  },
  {
    id: 6,
    question: 'Quais são os cuidados pós?',
    answer:
      'Após o procedimento, recomendamos: evitar contato com produtos de limpeza sem luvas por 24h, não remover o gel com as unhas ou objetos pontiagudos, usar óleo hidratante para cutículas diariamente, e agendar a manutenção a cada 2-3 semanas.',
  },
  {
    id: 7,
    question: 'Manicure e pedicure ao mesmo tempo?',
    answer:
      'Sim! Você pode fazer manicure e pedicure simultaneamente. Temos profissionais capacitados para realizar ambos os serviços de forma eficiente, otimizando seu tempo. O procedimento combinado dura aproximadamente 2-3 horas.',
  },
  {
    id: 8,
    question: 'A gestante pode fazer?',
    answer:
      'Sim, a técnica russa é segura para gestantes. Não utilizamos produtos químicos agressivos e o método é delicado. No entanto, recomendamos sempre consultar seu médico antes de qualquer procedimento estético durante a gravidez.',
  },
  {
    id: 9,
    question: 'Unha precisa respirar?',
    answer:
      'Esta é uma ideia popular, mas não cientificamente comprovada. As unhas são feitas de queratina (proteína morta) e não "respiram". O que é importante é manter a unha saudável com hidratação adequada e remoção correta do produto quando necessário.',
  },
  {
    id: 10,
    question: 'Posso tirar gel eu mesma em casa?',
    answer:
      'Não recomendamos. A remoção inadequada pode danificar a unha natural, causando descamação e fragilidade. É importante que a remoção seja feita por profissionais capacitados que utilizam os produtos e técnicas corretas para preservar a saúde da sua unha.',
  },
];

const benefits = [
  'Sem cortes ou machucados',
  'Cutículas mais finas ao longo do tempo',
  'Esmaltação com duração de 2-3 semanas',
  'Unha natural protegida e fortalecida',
  'Técnica importada da Rússia',
  'Profissionais certificados',
];

const Technique = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(1);
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
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="tecnica" ref={sectionRef} className="section-padding bg-cream">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-subtitle">Conheça</span>
          <h2 className="section-title mb-6">Nossa Técnica</h2>
          <p className="font-body text-[#5a4a42] leading-relaxed">
            A técnica russa original de cutilagem e esmaltação, trazida
            diretamente da Rússia para o Brasil com todo o rigor e excelência.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-20">
          {/* Image Side */}
          <div
            className={`relative transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <video
                src="/videos/tecnica.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d2420]/60 via-transparent to-transparent" />
            </div>

            {/* Benefits Card */}
            <div className="absolute -bottom-8 -right-12 md:right-0 bg-white rounded-2xl shadow-xl p-6 max-w-[280px]">
              <h4 className="font-heading text-lg text-[#2d2420] mb-4">
                Benefícios
              </h4>
              <ul className="space-y-2">
                {benefits.map((benefit, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 font-body text-xs text-[#5a4a42]"
                  >
                    <Check size={14} className="text-[#c9a55c] flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Decorative */}
            <div className="absolute -top-6 -left-6 w-32 h-32 border-2 border-[#c9a55c]/30 rounded-full -z-10" />
          </div>

          {/* Content Side */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-12'
            }`}
          >
            <h3 className="font-heading text-3xl text-[#2d2420] mb-6">
              A Técnica Russa
            </h3>

            <div className="space-y-6 font-body text-[#5a4a42] leading-relaxed">
              <p>
                Nossa manicure/pedicure é feita <strong>sem usar instrumentos de corte</strong>, sem creme ou água, utilizando apenas aparelhos de podologia e brocas especiais importadas.
              </p>
              <p>
                É um método <strong>delicado e seguro</strong>, sem perigo de cortes profundos e machucados, capaz de entregar unhas mais profundamente cutiladas e modeladas. Deste modo, a cutícula cresce cada vez mais fina e lentamente.
              </p>
              <p>
                Nossa esmaltação é feita com <strong>esmaltes em gel importados</strong> que garantem duração e brilho por mais de 2 semanas.
              </p>
              <p>
                O método Nord de esmaltação em gel possibilita que a unha natural fique protegida e cresça do tamanho desejado <strong>sem quebrar e sem precisar de alongamento</strong>.
              </p>
            </div>

            <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg">
              <p className="font-heading text-xl text-[#2d2420] italic mb-2">
                "Técnica Russa e esmaltação em gel"
              </p>
              <p className="font-body text-sm text-[#5a4a42]">
                Stress free, que te acompanha em todos os momentos da vida
                (trabalho, viagens) trazendo mais praticidade para quem não tem
                tempo a perder.
              </p>
            </div>

            <button
              onClick={() =>
                window.dispatchEvent(new Event('open-agendar-modal'))
              }
              className="btn-primary mt-8 flex items-center gap-2"
            >
              <Calendar size={18} />
              Agendar Agora
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-12">
          <span className="section-subtitle">Dúvidas</span>
          <h3 className="font-heading text-3xl md:text-4xl text-[#2d2420]">
            Perguntas Frequentes
          </h3>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, idx) => (
            <div
              key={faq.id}
              className={`border-b border-[#e8e0dc] transition-all duration-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <button
                onClick={() =>
                  setOpenFAQ(openFAQ === faq.id ? null : faq.id)
                }
                className="w-full py-6 flex items-center justify-between text-left group"
              >
                <span className="font-body text-sm md:text-base text-[#2d2420] font-medium pr-4 group-hover:text-[#c97d6a] transition-colors">
                  {faq.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-[#c97d6a] flex-shrink-0 transition-transform duration-300 ${
                    openFAQ === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFAQ === faq.id ? 'max-h-96 pb-6' : 'max-h-0'
                }`}
              >
                <p className="font-body text-sm text-[#5a4a42] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Technique;
