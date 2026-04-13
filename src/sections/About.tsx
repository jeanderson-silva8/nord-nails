import { useEffect, useRef, useState } from 'react';
import { Award, Users, Heart, Sparkles } from 'lucide-react';

const About = () => {
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

  const values = [
    {
      icon: Award,
      title: 'Excelência',
      description:
        'Buscamos a perfeição em cada detalhe, desde o atendimento até o resultado final.',
    },
    {
      icon: Users,
      title: 'Profissionalismo',
      description:
        'Nossa equipe é treinada pelos melhores profissionais vindos diretamente de Moscou.',
    },
    {
      icon: Heart,
      title: 'Paixão',
      description:
        'Amamos o que fazemos e isso se reflete em cada unha que cuidamos.',
    },
    {
      icon: Sparkles,
      title: 'Inovação',
      description:
        'Sempre atualizados com as últimas tendências e técnicas do mercado.',
    },
  ];

  return (
    <section id="sobre" ref={sectionRef} className="section-padding bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20">
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Image Side */}
          <div
            className={`relative transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="relative">
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/images/sobre_historia.jpg"
                  alt="Equipe Nord Nails"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2420]/40 to-transparent" />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-xl p-6 max-w-[200px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#c9a55c]/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#c9a55c]" />
                  </div>
                  <div>
                    <p className="font-heading text-3xl text-[#2d2420]">5+</p>
                    <p className="font-body text-xs text-[#5a4a42]">Anos</p>
                  </div>
                </div>
                <p className="font-body text-xs text-[#5a4a42] leading-relaxed">
                  De experiência trazendo a técnica russa original para o Brasil
                </p>
              </div>

              {/* Decorative Element */}
              <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-[#c97d6a]/30 rounded-2xl -z-10" />
            </div>
          </div>

          {/* Content Side */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-12'
            }`}
          >
            <span className="section-subtitle">Sobre Nós</span>
            <h2 className="section-title mb-6">
              A História da
              <br />
              <span className="text-[#c97d6a]">Nord Nails</span>
            </h2>

            <div className="space-y-6 font-body text-[#5a4a42] leading-relaxed">
              <p>
                A Nord Nails foi criada por <strong>Elina Zhabrailova</strong> e{' '}
                <strong>Anastasia Kozhukhovskaya</strong>, duas russas, amigas e
                sócias. Ao se mudarem para o Brasil, ambas sentiam falta da
                praticidade e durabilidade da técnica de manicure russa aqui no
                novo país.
              </p>
              <p>
                Desse desejo surgiu o nosso conceito: apresentar a praticidade e
                os benefícios da técnica russa para mais e mais brasileiras. A
                Nord Nails é pioneira na técnica original russa de cutilagem e
                esmaltação no Brasil.
              </p>
              <p>
                Nossa primeira unidade foi inaugurada em <strong>2019</strong> e
                hoje contamos com um total de <strong>três unidades</strong>{' '}
                entre Brasília e São Paulo, todas mantendo o mesmo padrão de
                excelência e qualidade.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-8 pt-8 border-t border-[#e8e0dc]">
              <p className="font-heading text-xl text-[#2d2420] italic">
                "Unhas impecáveis, mulheres confiantes"
              </p>
              <p className="font-body text-sm text-[#5a4a42] mt-2">
                — Elina & Anastasia, Fundadoras
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="text-center mb-12">
          <span className="section-subtitle">Nossos Valores</span>
          <h3 className="font-heading text-3xl md:text-4xl text-[#2d2420]">
            O Que Nos Define
          </h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, idx) => (
            <div
              key={value.title}
              className={`group text-center p-8 rounded-2xl bg-cream hover:bg-white hover:shadow-xl transition-all duration-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${(idx + 2) * 150}ms` }}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#c97d6a]/10 flex items-center justify-center group-hover:bg-[#c97d6a] group-hover:scale-110 transition-all duration-300">
                <value.icon className="w-7 h-7 text-[#c97d6a] group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-heading text-xl text-[#2d2420] mb-3">
                {value.title}
              </h4>
              <p className="font-body text-sm text-[#5a4a42] leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Team Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <span className="section-subtitle">Nossa Equipe</span>
            <h3 className="font-heading text-3xl md:text-4xl text-[#2d2420]">
              Profissionais de Excelência
            </h3>
          </div>

          <div
            className={`bg-cream rounded-3xl p-8 md:p-12 transition-all duration-1000 delay-500 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="font-heading text-2xl md:text-3xl text-[#2d2420] mb-4">
                  Equipe Profissional
                </h4>
                <p className="font-body text-[#5a4a42] leading-relaxed mb-6">
                  Prezando sempre pela alta qualidade da nossa entrega, nossa
                  equipe original foi capacitada e treinada por profissionais
                  vindos diretamente de Moscou, para que pudéssemos oferecer a
                  original técnica russa, exatamente como é feita há anos.
                </p>
                <p className="font-body text-[#5a4a42] leading-relaxed">
                  Com o passar do tempo, nossas profissionais mais antigas
                  alcançaram altíssimo nível de desempenho e hoje se tornaram
                  professoras, responsáveis pela capacitação dos novos
                  profissionais. Todos os nossos profissionais são capacitados
                  dentro de casa, mantendo o mesmo padrão e qualidade entre todas
                  as unidades.
                </p>
              </div>
              <div className="relative">
                <img
                  src="/images/equipe.webp"
                  alt="Equipe Nord Nails"
                  className="rounded-2xl shadow-lg w-full h-[350px] object-cover"
                />
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4">
                  <p className="font-heading text-2xl text-[#c9a55c]">100%</p>
                  <p className="font-body text-xs text-[#5a4a42]">
                    Certificadas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
