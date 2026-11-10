import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, Scale, BookOpen, AlertCircle, Sparkles, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import FoodCalculator from '@/components/FoodCalculator';
import { SITE_URL } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Calculadora de Porção de Ração: Quantidade Diária, Escore Corporal e Custo',
  description: 'Calcule a quantidade diária recomendada de ração (g/dia) para cães e gatos com base no peso metabólico, escore de condição corporal (WSAVA) e diretrizes oficiais da FEDIAF e NRC.',
  openGraph: {
    title: 'Calculadora de Porção de Ração: Quantidade Diária, Escore Corporal e Custo | PetRankings',
    description: 'Descubra exatamente quantos gramas de ração seu cão ou gato deve comer por dia com ajuste para peso ideal, rendimento do pacote e custo diário de alimentação.',
    url: `${SITE_URL}/calculadora`,
  },
  alternates: {
    canonical: `${SITE_URL}/calculadora`,
  },
};

export default function CalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora de Porção Diária de Ração e Custo Pet',
    url: `${SITE_URL}/calculadora`,
    description: 'Ferramenta zootécnica para estimar a quantidade diária de alimento seco para cães e gatos com base no peso metabólico (FEDIAF/NRC) e escore de condição corporal (WSAVA).',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como é calculada a quantidade de ração diária que o pet deve comer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O cálculo baseia-se na Necessidade Energética de Manutenção (NEM), calculada a partir do peso metabólico do animal (Peso^0.75 para cães e Peso^0.67 para gatos) multiplicado pelo fator de atividade, fase reprodutiva e escore de condição corporal (WSAVA), conforme as diretrizes da FEDIAF e NRC. A energia resultante (kcal/dia) é dividida pela densidade calórica real da ração.',
        },
      },
      {
        '@type': 'Question',
        name: 'O sexo do pet (macho ou fêmea) altera a quantidade de comida diária?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Para cães e gatos adultos em manutenção, o sexo biológico isolado não altera o cálculo de calorias segundo os compêndios do NRC e da FEDIAF. O dimorfismo de porte entre machos e fêmeas já é contemplado diretamente no peso corporal do animal. A única variação comprovada ocorre em fêmeas reprodutoras nas últimas semanas de gestação e durante a fase de amamentação (lactação), quando a demanda calórica cresce fortemente.',
        },
      },
      {
        '@type': 'Question',
        name: 'Por que o escore de condição corporal (ECC) ajusta a porção?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Animais com sobrepeso ou obesidade possuem excesso de tecido adiposo, que tem gasto metabólico menor que a massa muscular. Alimentar um pet com sobrepeso com base apenas no peso da balança perpetua o acúmulo de gordura. O ajuste por ECC aplica déficit gradual seguro para aproximar o animal do seu peso ideal de forma progressiva.',
        },
      },
      {
        '@type': 'Question',
        name: 'Por que usar balança digital em vez de copo medidor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Copos medidores de plástico geram erros de 15% a 25% na porção diária devido à variação no formato e na densidade dos croquetes entre diferentes marcas. Pequenas sobras acumuladas ao longo de meses são a principal causa oculta de sobrepeso e obesidade em cães e gatos.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div style={{ backgroundColor: 'var(--bg-subtle)', minHeight: '100vh', paddingBottom: '80px' }}>
        {/* Barra Superior de Breadcrumbs Padronizada */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-cream)',
            padding: '10px 0',
          }}
        >
          <div className="container">
            <nav
              aria-label="Trilha de Navegação"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
              }}
            >
              <Link href="/" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
                Início
              </Link>
              <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
              <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700 }}>
                Calculadora de Porção e Custo
              </span>
            </nav>
          </div>
        </div>

        {/* Hero Institucional Padronizado (Invariante 13) */}
        <section
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-cream)',
            padding: '24px 0 20px 0',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: '860px' }}>
              {/* Camada 1: Eyebrow Badge com Ícone Temático */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--brand-forest-50)',
                  border: '1px solid var(--brand-forest-200)',
                  color: 'var(--brand-forest-700)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                <Calculator size={13} aria-hidden="true" />
                <span>Ferramenta Bromatológica Interativa</span>
              </div>

              {/* Camada 2: H1 em Sentence Case */}
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.5rem, 2.8vw, 1.95rem)',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  marginBottom: '8px',
                }}
              >
                Calculadora de ração: quantidade diária recomendada, escore corporal e custo para cães e gatos
              </h1>

              {/* Camada 3: Lead Técnico */}
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-body)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                Estime a necessidade calórica diária em kcal, a porção em gramas por refeição, o tempo de rendimento do pacote e o custo diário real de alimentação com base no peso metabólico, escore corporal (WSAVA) e padrões da FEDIAF e NRC.
              </p>
            </div>
          </div>
        </section>

        {/* Componente Interativo Principal */}
        <div className="container" style={{ maxWidth: '1080px', paddingTop: '24px' }}>
          <main style={{ marginBottom: '60px' }}>
            <FoodCalculator />
          </main>

          {/* Seção Educativa & Rigor Zootécnico */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid var(--border-cream)',
              padding: '36px 32px',
              boxShadow: '0 4px 20px rgba(8, 33, 21, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--brand-forest-700)',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Metodologia Científica
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                Como funciona o cálculo zootécnico de porção diária?
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {/* Pilar 1 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '0.90rem',
                  }}
                >
                  1
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                      Peso metabólico
                    </h3>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--brand-forest-50)',
                        border: '1px solid var(--border-cream)',
                        fontSize: '0.70rem',
                        fontWeight: 700,
                        color: 'var(--brand-forest-800)',
                      }}
                    >
                      PV<sup>0,75</sup> / PV<sup>0,67</sup>
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                    O consumo calórico não cresce de forma linear com o peso. Um cão de 40 kg não consome quatro vezes o que um cão de 10 kg consome. A energia é calculada pela superfície corporal e dissipação térmica real.
                  </p>
                </div>
              </div>

              {/* Pilar 2 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '0.90rem',
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Fase de vida e rotina
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                    A castração e a vida em apartamento reduzem o gasto calórico diário, enquanto filhotes em crescimento e fêmeas em gestação ou lactação demandam aportes ampliados para sustentação tecidual.
                  </p>
                </div>
              </div>

              {/* Pilar 3 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '0.90rem',
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Escore corporal (ECC)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                    Conforme o padrão global da WSAVA (1 a 9 pontos), animais com sobrepeso recebem déficit calórico moderado para atingir o peso ideal com segurança, sem perda abrupta de massa magra.
                  </p>
                </div>
              </div>

              {/* Pilar 4 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '0.90rem',
                  }}
                >
                  4
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Densidade da ração
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                    Alimentos com maior energia metabolizável (ex: 4.100 kcal/kg) demandam porções menores em gramas que alimentos leves ou de emagrecimento (ex: 3.200 kcal/kg) para a mesma meta energética.
                  </p>
                </div>
              </div>
            </div>

            {/* Perguntas Frequentes (FAQ) */}
            <div style={{ borderTop: '1px solid var(--border-cream)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-forest-900)', margin: '0 0 16px' }}>
                Dúvidas comuns sobre porção e manejo alimentar
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-muted)' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    O sexo do animal (macho ou fêmea) altera a porção de ração diária?
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                    Para cães e gatos adultos saudáveis em manutenção, o sexo biológico isolado não altera o cálculo de energia de acordo com o National Research Council (NRC 2006) e a FEDIAF. O dimorfismo de tamanho entre machos e fêmeas já é considerado automaticamente pelo peso corporal em quilos. A única alteração ocorre em fêmeas reprodutoras nas semanas finais de gestação e durante a fase de amamentação (lactação).
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-muted)' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Posso confiar na tabela impressa no verso do pacote?
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                    As tabelas dos fabricantes oferecem faixas de peso genéricas (ex: de 10 a 15 kg). Se o seu cão é castrado ou sedentário, utilizar a faixa máxima sugerida pelo pacote causará acúmulo de gordura. O cálculo individualizado é muito mais seguro.
                  </p>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-muted)' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Como fazer a transição se eu for trocar de marca?
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                    A transição deve ser feita gradualmente ao longo de 7 dias para evitar diarreia osmótica e vômitos: Dias 1 e 2 (75% ração antiga + 25% nova); Dias 3 e 4 (50% antiga + 50% nova); Dias 5 e 6 (25% antiga + 75% nova); Dia 7 (100% ração nova).
                  </p>
                </div>
              </div>
            </div>

            {/* Fontes Primárias e Disclaimer Legal */}
            <div
              style={{
                borderTop: '1px solid var(--border-cream)',
                paddingTop: '20px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: '0 0 8px' }}>
                <strong>Fontes científicas consultadas:</strong> FEDIAF Nutritional Guidelines for Complete and Complementary Pet Food for Cats and Dogs (2025); National Research Council (NRC): Nutrient Requirements of Dogs and Cats (2006); Manual Pet Food Brasil (ABINPET, 11ª Edição); Diretrizes de Avaliação Nutricional da WSAVA (World Small Animal Veterinary Association).
              </p>
              <p style={{ margin: 0 }}>
                <em>Aviso editorial: Os valores calculados são estimativas teóricas de referência para animais saudáveis. Fatores individuais como temperatura ambiente, genética, castração e escore de condição corporal (ECC) influenciam a demanda real. Consulte sempre o médico veterinário de confiança do seu animal.</em>
              </p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
