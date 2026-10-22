import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, Scale, BookOpen, AlertCircle, Sparkles, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import FoodCalculator from '@/components/FoodCalculator';
import { SITE_URL } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Calculadora de Porção de Ração: Quantidade Diária e Custo por Dia',
  description: 'Calcule a quantidade diária recomendada de ração (g/dia) para cães e gatos, o rendimento do pacote e o custo diário com base nas fórmulas oficiais da FEDIAF e NRC.',
  openGraph: {
    title: 'Calculadora de Porção de Ração: Quantidade Diária e Custo por Dia | PetRankings',
    description: 'Descubra exatamente quantos gramas de ração seu cão ou gato deve comer por dia, quantos dias o pacote dura e o custo diário de alimentação.',
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
    description: 'Ferramenta zootécnica para estimar a quantidade diária de alimento seco para cães e gatos com base no peso metabólico (FEDIAF/NRC).',
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
          text: 'O cálculo baseia-se na Necessidade Energética de Manutenção (NEM), calculada a partir do peso metabólico do animal (Peso^0.75 para cães e Peso^0.67 para gatos) multiplicado pelo fator de atividade e castração, conforme as diretrizes da FEDIAF e NRC. A energia resultante (kcal/dia) é dividida pela densidade calórica da ração.',
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
      {
        '@type': 'Question',
        name: 'Quantas vezes ao dia devo oferecer a comida?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Para cães adultos saudáveis, recomenda-se dividir a porção diária em 2 a 3 refeições para evitar torção gástrica e picos de glicemia. Para gatos, recomenda-se fracionar em múltiplas pequenas porções ou utilizar comedouros interativos que estimulem o comportamento natural de caça.',
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
                Calculadora de ração: quantidade diária recomendada e custo por dia para cães e gatos
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
                Estime a necessidade calórica diária em kcal, a porção exata em gramas por refeição, o tempo de rendimento do pacote e o custo diário real de alimentação com base no peso metabólico e padrões de referência da FEDIAF e NRC.
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                  }}
                >
                  1
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                      Peso metabólico
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--brand-forest-50)',
                        border: '1px solid var(--border-cream)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--brand-forest-800)',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      PV<sup>0,75</sup> (cães) &bull; PV<sup>0,67</sup> (gatos)
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                    O consumo calórico de um animal não cresce de forma linear com o peso. Um cão de 40 kg não come quatro vezes o que um cão de 10 kg come. Por isso, a zootecnia moderna calcula a energia a partir do peso metabólico (onde o peso vivo é elevado à potência de 0,75 para cães e 0,67 para gatos), respeitando a dissipação de calor e o metabolismo real.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Fator fisiológico e castração
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                    A castração reduz a taxa metabólica de cães e gatos em 20% a 30%. Ao mesmo tempo, filhotes em crescimento e cães atletas exigem aporte proteico e calórico superior para sustentar o desenvolvimento e a recuperação tecidual.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Densidade calórica da ração (kcal/kg)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                    Alimentos Super Premium possuem maior digestibilidade e teor de gorduras nobres, exigindo porções menores em gramas quando comparados a alimentos com alta concentração de carboidratos e cinzas minerais.
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
                <strong>Fontes científicas consultadas:</strong> FEDIAF Nutritional Guidelines for Complete and Complementary Pet Food for Cats and Dogs (2024); National Research Council (NRC) — Nutrient Requirements of Dogs and Cats (2006); Manual Pet Food Brasil (ABINPET, 11ª Edição).
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
