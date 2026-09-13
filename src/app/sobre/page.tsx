import React from 'react';
import Link from 'next/link';
import {
  PawPrint,
  ShieldCheck,
  Building2,
  FileCheck2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Award,
  Sparkles,
  Zap,
  Scale,
  HeartPulse,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metodologia e Diretrizes Científicas — PetRankings',
  description:
    'Conheça a fundamentação científica, o cálculo em Matéria Seca (MS), a estimativa de Energia Metabolizável (NRC/ABINPET), a matriz de 4 pilares e as 4 faixas de conformidade.',
  alternates: {
    canonical: '/sobre',
  },
  openGraph: {
    title: 'Metodologia e Diretrizes Científicas — PetRankings',
    description:
      'Conheça a fundamentação científica, o cálculo em Matéria Seca, a estimativa de Energia Metabolizável (NRC/ABINPET) e as faixas de conformidade.',
    url: '/sobre',
    siteName: 'PetRankings',
    locale: 'pt_BR',
    type: 'article',
  },
};

export default function SobrePage() {
  return (
    <main style={{ paddingBottom: '80px' }}>
      {/* Header Institucional */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '48px 0 36px 0',
          backgroundImage:
            'radial-gradient(ellipse at 85% 15%, rgba(212, 175, 55, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(15, 54, 35, 0.05) 0%, transparent 55%)',
        }}
      >
        <div className="container" style={{ maxWidth: '900px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--brand-forest-800)',
              marginBottom: '20px',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar para o Índice Geral</span>
          </Link>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 900,
              color: 'var(--brand-forest-900)',
              lineHeight: 1.18,
              letterSpacing: '-0.5px',
              marginBottom: '16px',
            }}
          >
            Metodologia e Critérios da Avaliação Nutricional
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            O <strong>PetRankings</strong> atua como um portal independente de avaliação técnica e confronto documental das informações nutricionais divulgadas pelas marcas em seus websites oficiais para alimentos de cães e gatos no Brasil. O portal não emite juízos subjetivos de mérito: cada nota decorre estritamente dos níveis de garantia e da ordem decrescente de ingredientes declarados publicamente pelos próprios fabricantes (com custódia probatória e snapshot público no Wayback Machine, amparados pelos Arts. 30 e 31 do Código de Defesa do Consumidor), confrontados matematicamente com os parâmetros do Manual Pet Food Brasil (ABINPET, 11ª Edição) e diretrizes do MAPA.
          </p>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <div className="container" style={{ maxWidth: '900px', marginTop: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Seção 1: Fundamentação Legal e Regulatória */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <ShieldCheck size={24} color="var(--brand-forest-700)" />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                1. Fundamentação Legal e Normativa Brasileira
              </h2>
            </div>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: '20px' }}>
              A arquitetura avaliativa do sistema está integralmente alinhada ao arcabouço regulatório oficial que disciplina a nutrição de animais de companhia e as relações de consumo no Brasil:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-cream-main)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--gold-500)' }}>
                <strong style={{ display: 'block', color: 'var(--brand-forest-900)', fontSize: '0.98rem', marginBottom: '4px' }}>
                  Manual Pet Food Brasil (ABINPET / ABEMPET — 11ª Edição)
                </strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                  Referência científica máxima da indústria pet nacional para perfis nutricionais mínimos, limites máximos seguros em Matéria Seca (MS), regras de alegações comerciais (claims de carne) e balanceamento mineral para cães e gatos em todas as fases de vida.
                </p>
              </div>

              <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-cream-main)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--brand-forest-600)' }}>
                <strong style={{ display: 'block', color: 'var(--brand-forest-900)', fontSize: '0.98rem', marginBottom: '4px' }}>
                  Marco Regulatório do MAPA (Decreto nº 12.031/2024 e IN MAPA nº 30/2009)
                </strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                  Regulamenta o registro de produtos e estabelecimentos fabricantes de alimentos para animais, determinando a ordem decrescente compulsória de inclusão de matérias-primas na lista de ingredientes e a exatidão das garantias declaradas.
                </p>
              </div>

              <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-cream-main)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #3b82f6' }}>
                <strong style={{ display: 'block', color: 'var(--brand-forest-900)', fontSize: '0.98rem', marginBottom: '4px' }}>
                  Código de Defesa do Consumidor (Lei Federal nº 8.078/1990 — Arts. 6º, III e 31)
                </strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                  Consagra o direito fundamental do tutor de animais de companhia à informação clara, precisa e ostensiva sobre a composição, características nutricionais, eventuais riscos e atributos dos produtos ofertados no mercado de consumo.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 2: Conversões Científicas: Matéria Seca & Energia Metabolizável */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Zap size={24} color="var(--brand-forest-700)" />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                2. Metodologia de Cálculo em Matéria Seca e Energia Metabolizável
              </h2>
            </div>

            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--brand-forest-800)', marginTop: '8px', marginBottom: '8px' }}>
              2.1. Por que Analisamos em Matéria Seca (MS)?
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: '14px' }}>
              Nas páginas oficiais e embalagens, os níveis de garantia são expressos em <em>Matéria Natural (MN)</em>, computando a umidade do produto (que varia de 8% a 12% em rações secas e até 82% em alimentos úmidos). Como a água não possui densidade nutricional calórica ou proteica, ela dilui a concentração aparente dos nutrientes.
            </p>

            <div style={{ backgroundColor: 'var(--brand-forest-950)', color: '#ffffff', padding: '16px 20px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.92rem', marginBottom: '16px', overflowX: 'auto' }}>
              Nutriente na Matéria Seca (%) = [Nutriente Declarado na MN (%) × 100] ÷ [100 - Umidade Máxima (%)]
            </div>

            <p style={{ fontSize: '0.90rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: '24px' }}>
              <strong>Exemplo prático:</strong> Uma ração com 10% de umidade e 26% de proteína bruta declarada possui, efetivamente, <strong>28,89% de proteína bruta em Matéria Seca</strong>. É exclusivamente esse teor purificado que a literatura veterinária utiliza para validar se o alimento supre a demanda fisiológica do pet.
            </p>

            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--brand-forest-800)', marginBottom: '8px' }}>
              2.2. Estimativa da Energia Metabolizável (EM) — Método Preditivo NRC / ABINPET
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: '14px' }}>
              Quando a energia metabolizável não é informada expressamente pelo fabricante em sua página oficial, o sistema calcula a estimativa calórica com base nas equações preditivas oficiais consolidadas pelo NRC (National Research Council) e adotadas pelo Manual Pet Food Brasil da ABINPET:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-cream-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>1. Extrativos Não-Nitrogenados (ENN %)</strong>
                <span style={{ fontFamily: 'monospace', fontSize: '0.80rem', color: 'var(--brand-forest-800)' }}>ENN = 100 - (Umidade + PB + EE + FB + MM)</span>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-cream-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>2. Energia Bruta (EB em kcal/kg)</strong>
                <span style={{ fontFamily: 'monospace', fontSize: '0.80rem', color: 'var(--brand-forest-800)' }}>EB = (5,7×PB) + (9,4×EE) + 4,1×(ENN + FB)</span>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-cream-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>3. Coeficiente de Digestibilidade (CDE %)</strong>
                <span style={{ fontFamily: 'monospace', fontSize: '0.80rem', color: 'var(--brand-forest-800)' }}>CDE_Cão = 91,2 - (1,43 × FB_MS)<br />CDE_Gato = 87,9 - (0,88 × FB_MS)</span>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--bg-cream-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>4. Energia Metabolizável (EM kcal/kg)</strong>
                <span style={{ fontFamily: 'monospace', fontSize: '0.80rem', color: 'var(--brand-forest-800)' }}>EM_Cão = ED - (1,04 × PB_g/kg)<br />EM_Gato = ED - (0,77 × PB_g/kg)</span>
              </div>
            </div>
          </section>

          {/* Seção 3: Matriz dos 4 Pilares do Score (0 a 100) */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Scale size={24} color="var(--brand-forest-700)" />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                3. A Matriz dos 4 Pilares Técnicos (0 a 100 Pontos)
              </h2>
            </div>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: '20px' }}>
              O índice de conformidade é determinado por um algoritmo 100% determinístico e verificável, distribuído em 4 pilares ponderados:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ border: '1px solid var(--border-cream)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--brand-forest-900)', fontSize: '1.02rem' }}>Pilar 1: Conformidade Nutricional em Matéria Seca (MS)</strong>
                  <span style={{ fontWeight: 800, color: 'var(--brand-forest-700)', backgroundColor: 'var(--brand-forest-50)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.88rem' }}>40 Pontos</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Verifica se Proteína Bruta, Extrato Etéreo (Gordura), Cálcio e Fósforo atendem aos pisos e respeitam os limites máximos na MS com margem técnica de segurança industrial (+40 pts) ou no limite estrito (+20 pts). Caso algum nutriente esteja abaixo do piso seguro, o pilar zera (0 pts).
                </p>
              </div>

              <div style={{ border: '1px solid var(--border-cream)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--brand-forest-900)', fontSize: '1.02rem' }}>Pilar 2: Equilíbrio e Relação Cálcio : Fósforo (Ca:P)</strong>
                  <span style={{ fontWeight: 800, color: 'var(--brand-forest-700)', backgroundColor: 'var(--brand-forest-50)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.88rem' }}>20 Pontos</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Calcula a relação matemática entre cálcio e fósforo declarados. Proporção ideal (Adultos: 1,1:1 a 1,6:1; Filhotes: 1,1:1 a 1,5:1) confere 20 pts. Faixa tolerável (1,0:1 até 2,0:1) confere 10 pts. Desbalanço crítico confere 0 pts, evitando riscos de calcificação ou sobrecarga renal.
                </p>
              </div>

              <div style={{ border: '1px solid var(--border-cream)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--brand-forest-900)', fontSize: '1.02rem' }}>Pilar 3: Qualidade Declarada dos Ingredientes Principais</strong>
                  <span style={{ fontWeight: 800, color: 'var(--brand-forest-700)', backgroundColor: 'var(--brand-forest-50)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.88rem' }}>25 Pontos</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Em obediência à IN MAPA 30/2009 e ao Decreto nº 12.031/2024, os ingredientes aparecem em ordem decrescente de quantidade na declaração oficial do produto. Primeiro ingrediente de fonte cárnea de alta digestibilidade confere +15 pts; segundo ingrediente de origem animal ou carboidrato nobre confere +10 pts adicionais.
                </p>
              </div>

              <div style={{ border: '1px solid var(--border-cream)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--brand-forest-900)', fontSize: '1.02rem' }}>Pilar 4: Transparência e Atributos Funcionais Declarados</strong>
                  <span style={{ fontWeight: 800, color: 'var(--brand-forest-700)', backgroundColor: 'var(--brand-forest-50)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.88rem' }}>15 Pontos</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Conservantes 100% naturais sem BHA/BHT (+5 pts), inclusão comprovada de Ômega-3 funcional ou prebióticos no nível de garantia (+5 pts) e aderência estrita de alegações de carne segundo a Tabela 14 do Manual ABINPET (+5 pts).
                </p>
              </div>
            </div>
          </section>

          {/* Seção 4: Estrutura em 4 Faixas e Ausência de Ranqueamento Ordinal */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Award size={24} color="var(--gold-600)" />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                4. As 4 Faixas Oficiais de Conformidade e Ausência de Ranqueamento Ordinal
              </h2>
            </div>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: '20px' }}>
              Para salvaguardar a neutralidade institucional e mitigar disputas comerciais, o PetRankings <strong>não utiliza posições ordinais (1º, 2º ou 3º lugar)</strong> nos produtos. Em vez de uma competição subjetiva, os alimentos são agrupados estritamente por faixas de pontuação técnica, com critério de desempate alfabético neutro pelo nome comercial:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ border: '1.5px solid #d4af37', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'rgba(212, 175, 55, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🥇</span>
                  <strong style={{ color: '#855d14', fontSize: '1.05rem' }}>Nível Ouro (90 a 100 pts)</strong>
                </div>
                <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: 800, color: '#855d14', textTransform: 'uppercase', marginBottom: '8px' }}>Padrão Superior</span>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                  Alimentos completos com excelente perfil nutricional em Matéria Seca, ingredientes nobres preponderantes, proporção Ca:P exemplar e conservantes 100% naturais.
                </p>
              </div>

              <div style={{ border: '1.5px solid #94a3b8', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'rgba(148, 163, 184, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🥈</span>
                  <strong style={{ color: '#475569', fontSize: '1.05rem' }}>Nível Prata (75 a 89 pts)</strong>
                </div>
                <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Padrão Ótimo</span>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                  Atende amplamente a todas as exigências das diretrizes veterinárias com boa densidade proteica e equilíbrio mineral seguro para a manutenção saudável do pet.
                </p>
              </div>

              <div style={{ border: '1.5px solid #d97706', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'rgba(217, 119, 6, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🥉</span>
                  <strong style={{ color: '#b45309', fontSize: '1.05rem' }}>Nível Bronze (60 a 74 pts)</strong>
                </div>
                <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: '8px' }}>Padrão Regular</span>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                  Cumpre os pisos regulamentares essenciais da alimentação animal estabelecidos pelo MAPA, podendo apresentar maior fração de cereais ou uso de conservantes sintéticos declarados.
                </p>
              </div>

              <div style={{ border: '1.5px solid #ef4444', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <strong style={{ color: '#b91c1c', fontSize: '1.05rem' }}>Sob Observação (&lt; 60 pts)</strong>
                </div>
                <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', marginBottom: '8px' }}>Parâmetros Limítrofes</span>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                  Apresenta dados nutricionais inconsistentes, desequilíbrio na relação Cálcio : Fósforo ou teores garantidos abaixo das diretrizes de segurança da literatura nutricional veterinária.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 5: Segregação de Alimentos Coadjuvantes */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Stethoscope size={24} color="#3b82f6" />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                5. Segregação e Critérios de Alimentos Coadjuvantes
              </h2>
            </div>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-body)', lineHeight: 1.7, marginBottom: '16px' }}>
              Alimentos formulados para suporte a patologias específicas (como doença renal crônica, cardiopatias, diabetes, intolerâncias alimentares ou cálculos urinários) são denominados legalmente como <strong>Alimentos Coadjuvantes</strong> e possuem regras próprias de apresentação:
            </p>

            <div style={{ padding: '16px 20px', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #3b82f6', marginBottom: '16px' }}>
              <strong style={{ display: 'block', color: '#1e3a8a', fontSize: '0.96rem', marginBottom: '6px' }}>
                Ausência de Pontuação Competitiva & Prescrição Obrigatória
              </strong>
              <p style={{ fontSize: '0.88rem', color: '#1e40af', lineHeight: 1.6, margin: 0 }}>
                Dietas coadjuvantes frequentemente restringem determinados nutrientes de propósito clínico (por exemplo, fósforo e sódio reduzidos para pacientes renais). Por essa razão biológica, <strong>não concorrem nas tabelas de pontuação de cães e gatos sadios</strong> e contam com catálogo isolado em <Link href="/coadjuvantes" style={{ fontWeight: 800, textDecoration: 'underline' }}>Alimentos Coadjuvantes</Link>, acompanhadas do alerta obrigatório de uso sob prescrição médico-veterinária.
              </p>
            </div>
          </section>

          {/* Seção 6: Canal do Fabricante e Direito de Resposta */}
          <section
            style={{
              backgroundColor: 'var(--brand-forest-900)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--gold-400)' }}>
              <Building2 size={20} />
              <strong style={{ textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '0.5px' }}>
                Governança & Relações com o Fabricante
              </strong>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 800,
                marginBottom: '12px',
              }}
            >
              Direito de Resposta Institucional (Right of Reply)
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '20px' }}>
              Para assegurar a máxima fidelidade técnica perante as indústrias, responsáveis técnicos (médicos veterinários e zootecnistas) têm à disposição canal transparente com prazo de atendimento de até 5 dias úteis para comunicação de novos links de páginas oficiais de produtos, notificação de reformulação de fórmulas ou atualização de composições declaradas.
            </p>

            <Link
              href="/fabricante"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                backgroundColor: 'var(--gold-500)',
                color: '#082115',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 800,
                fontSize: '0.90rem',
                textDecoration: 'none',
              }}
            >
              <span>Fabricante: Solicite Atualização de Dados Oficiais</span>
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
