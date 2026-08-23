import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Award,
  Heart,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import AdPlaceholder from '@/components/AdPlaceholder';
import HomeRankingsClient from '@/components/HomeRankingsClient';
import FaqAccordion from '@/components/FaqAccordion';

// Revalidar a cada 60 segundos para garantir performance e dados frescos
export const revalidate = 60;

export default async function HomePage() {
  // Busca direta no banco de dados (Server-Side Rendering instantâneo)
  const rawRankings = await prisma.ranking.findMany({
    where: { isPublished: true },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: [
      { dataUpdatedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const rankings = rawRankings.map((r) => ({
    ...r,
    dataUpdatedAt: r.dataUpdatedAt ? r.dataUpdatedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const faqs = [
    {
      q: 'Como o PetRankings calcula as notas de cada produto?',
      a: 'Nossa equipe pesquisa com carinho as avaliações reais deixadas por compradores nas 5 maiores lojas online do Brasil (Amazon, Mercado Livre, Petlove, Cobasi e Shopee). Calculamos a média simples dessas notas para entregar uma pontuação justa, transparente e fácil de comparar.',
    },
    {
      q: 'O que define qual produto fica em primeiro lugar (#1)?',
      a: 'É pura matemática e sinceridade! O produto que tiver a maior nota média entre as lojas assume o 1º lugar no pódio. Se houver empate na pontuação, fica na frente o produto que tiver mais avaliações somadas, garantindo que a escolha favorita de mais tutores se destaque.',
    },
    {
      q: 'Os links de compra influenciam a posição do ranking?',
      a: 'De jeito nenhum! Alguns botões possuem links de parceiros afiliados pelos quais recebemos uma pequena comissão se você decidir comprar, o que nos ajuda a manter o site gratuito. No entanto, nenhum valor pago altera notas, posições ou os destaques dos rankings.',
    },
    {
      q: 'O PetRankings substitui uma consulta ao veterinário?',
      a: 'Com certeza não! Nosso site é um guia amigo para te ajudar a comparar preços e a satisfação de outros tutores. Questões clínicas, dietas especiais e orientações de saúde devem ser sempre acompanhadas pelo médico veterinário de sua confiança.',
    },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PetRankings',
    url: 'https://petrankings.com.br',
    description:
      'Comparações sinceras e transparentes baseadas nas avaliações reais de tutores nas principais lojas do Brasil.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://petrankings.com.br/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '56px', paddingBottom: '72px' }}>
      {/* Dados Estruturados JSON-LD (FAQPage & WebSite) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* 1. Espaço Publicitário Superior Reservado */}
      <div className="container" style={{ marginTop: '20px' }}>
        <AdPlaceholder label="Espaço Publicitário Reservado — Topo" />
      </div>

      {/* 2. Hero Editorial Acolhedor com Mascotes e Luz Dourada */}
      <section
        aria-label="Apresentação do PetRankings"
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1.5px solid var(--border-cream)',
          padding: '60px 0 76px 0',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage:
            'radial-gradient(ellipse at 85% 20%, rgba(212, 175, 55, 0.09) 0%, transparent 60%), radial-gradient(ellipse at 15% 90%, rgba(15, 54, 35, 0.07) 0%, transparent 60%)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            {/* Texto de Apresentação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '640px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--brand-forest-50)',
                  border: '1.5px solid var(--brand-forest-200)',
                  padding: '7px 18px',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--brand-forest-900)',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  width: 'fit-content',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <Heart size={16} color="var(--gold-700)" aria-hidden="true" fill="var(--gold-700)" />
                <span>Feito com carinho para quem ama seus pets</span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.4rem, 4.6vw, 3.6rem)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: 'var(--brand-forest-900)',
                }}
              >
                Descubra o que há de <span style={{ color: 'var(--gold-700)', fontStyle: 'italic' }}>melhor e mais amado</span> para o seu pet.
              </h1>

              <p
                style={{
                  fontSize: '1.12rem',
                  color: 'var(--text-body)',
                  lineHeight: 1.68,
                }}
              >
                Escolher ração, areia sanitária ou brinquedos não precisa ser um quebra-cabeça. Reunimos as opiniões e notas reais de milhares de tutores nas maiores lojas online do Brasil para você acertar de primeira no que faz o seu melhor amigo feliz.
              </p>

              {/* Botões de Ação Hero */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', paddingTop: '10px' }}>
                <a
                  href="#rankings-section"
                  className="hero-primary-btn"
                >
                  <span>Explorar Rankings com Amor 🐾</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </a>

                <Link
                  href="/sobre#como-calculamos"
                  className="hero-secondary-btn"
                >
                  <span>Como Avaliamos</span>
                </Link>
              </div>
            </div>

            {/* Ilustrações dos Mascotes com Molduras Flutuantes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                position: 'relative',
              }}
            >
              {/* Mascote Cão */}
              <div
                style={{
                  position: 'relative',
                  width: '190px',
                  height: '260px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xl)',
                  border: '4px solid #ffffff',
                  transform: 'rotate(-3deg)',
                  backgroundColor: '#ffffff',
                  transition: 'var(--transition)',
                }}
                className="mascot-card"
              >
                <Image
                  src="/mascots/dog-mascot.jpg"
                  alt="Ilustração de um cão feliz representando o catálogo de produtos caninos"
                  fill
                  sizes="190px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: 'var(--dog-accent-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    border: '1px solid var(--dog-accent-border)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>🐕 Rações & Brinquedos</span>
                </div>
              </div>

              {/* Mascote Gato */}
              <div
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '250px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xl)',
                  border: '4px solid #ffffff',
                  transform: 'rotate(4deg)',
                  backgroundColor: '#ffffff',
                  marginTop: '32px',
                  transition: 'var(--transition)',
                }}
                className="mascot-card"
              >
                <Image
                  src="/mascots/cat-mascot.jpg"
                  alt="Ilustração de um gato curioso representando o catálogo de produtos felinos"
                  fill
                  sizes="180px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: 'var(--cat-accent-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    border: '1px solid var(--cat-accent-border)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>🐈 Areias & Nutrição</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Faixa de Métricas de Confiabilidade (Trust Ticker) */}
      <section className="container" aria-label="Diferenciais de confiabilidade do PetRankings">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px 22px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-cream)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-xs)',
              minHeight: '88px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--brand-forest-50)',
                color: 'var(--brand-forest-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--brand-forest-200)',
              }}
            >
              <ShieldCheck size={24} aria-hidden="true" />
            </div>
            <div>
              <strong style={{ fontSize: '0.98rem', color: 'var(--brand-forest-900)', display: 'block', lineHeight: 1.25, marginBottom: '2px' }}>
                Notas 100% Reais
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.35 }}>
                Conferidas à mão de tutores reais
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px 22px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-cream)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-xs)',
              minHeight: '88px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--gold-50)',
                color: 'var(--gold-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--gold-300)',
              }}
            >
              <ShoppingBag size={24} aria-hidden="true" />
            </div>
            <div>
              <strong style={{ fontSize: '0.98rem', color: 'var(--brand-forest-900)', display: 'block', lineHeight: 1.25, marginBottom: '2px' }}>
                5 Grandes Lojas Online
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.35 }}>
                Amazon, Petlove, Cobasi, ML e Shopee
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px 22px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-cream)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-xs)',
              minHeight: '88px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--brand-forest-50)',
                color: 'var(--brand-forest-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--brand-forest-200)',
              }}
            >
              <Star size={24} aria-hidden="true" />
            </div>
            <div>
              <strong style={{ fontSize: '0.98rem', color: 'var(--brand-forest-900)', display: 'block', lineHeight: 1.25, marginBottom: '2px' }}>
                Média Sincera e Imparcial
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.35 }}>
                Sem favorecer nenhuma marca
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px 22px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-cream)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-xs)',
              minHeight: '88px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--gold-50)',
                color: 'var(--gold-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--gold-300)',
              }}
            >
              <Award size={24} aria-hidden="true" />
            </div>
            <div>
              <strong style={{ fontSize: '0.98rem', color: 'var(--brand-forest-900)', display: 'block', lineHeight: 1.25, marginBottom: '2px' }}>
                Sem Posições Pagas
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-body)', lineHeight: 1.35 }}>
                O que é bom de verdade fica no topo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Seção Principal de Rankings com Filtros */}
      <section id="rankings-section" className="container" style={{ scrollMarginTop: '100px' }}>
        <div style={{ marginBottom: '28px' }}>
          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 800,
              color: 'var(--gold-700)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Nossos Guias & Rankings
          </span>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.4rem)', marginBottom: '8px' }}>
            Rankings Feitos para Facilitar sua Escolha
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '1.05rem' }}>
            Navegue pelas categorias e veja quais produtos conquistaram os maiores elogios de quem já comprou e testou em casa.
          </p>
        </div>

        {/* Componente Interativo com dados pré-renderizados do Servidor */}
        <HomeRankingsClient initialRankings={rankings} />
      </section>

      {/* 5. Espaço Publicitário Intermediário */}
      <div className="container">
        <AdPlaceholder label="Espaço Publicitário Reservado — Conteúdo" />
      </div>

      {/* 6. Resumo de Metodologia & Transparência Acolhedor */}
      <section className="container" aria-label="Metodologia e Transparência Editorial">
        <div
          style={{
            backgroundColor: 'var(--brand-forest-950)',
            color: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '52px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: 'var(--gold-400)',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                display: 'block',
                marginBottom: '10px',
              }}
            >
              Cuidado & Honestidade
            </span>
            <h2 style={{ color: '#ffffff', fontSize: '2.2rem', marginBottom: '18px', lineHeight: 1.25 }}>
              Como preparamos cada recomendação com carinho
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '26px' }}>
              A saúde e a felicidade do seu bichinho vêm sempre em primeiro lugar. Não usamos inteligência artificial para inventar notas nem aceitamos patrocínios para mudar posições. É a voz e a experiência de quem ama pets reunida para você!
            </p>
            <Link
              href="/sobre#como-calculamos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--gold-500)',
                color: '#382800',
                padding: '14px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.96rem',
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.35)',
                transition: 'var(--transition-fast)',
                minHeight: '46px',
              }}
            >
              <span>Conhecer nossa história e método 🐾</span>
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 22px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2 size={24} color="var(--gold-400)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <div>
                <strong style={{ color: '#ffffff', fontSize: '1.05rem', display: 'block', marginBottom: '3px' }}>
                  Coleta atenta e manual
                </strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Lançamos diretamente as avaliações de compradores de cada loja parceira.
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 22px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2 size={24} color="var(--gold-400)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <div>
                <strong style={{ color: '#ffffff', fontSize: '1.05rem', display: 'block', marginBottom: '3px' }}>
                  Cálculo sincero e sem segredos
                </strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  A média das notas define a ordem exata de cada ranking.
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 22px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2 size={24} color="var(--gold-400)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <div>
                <strong style={{ color: '#ffffff', fontSize: '1.05rem', display: 'block', marginBottom: '3px' }}>
                  Nenhuma marca compra o 1º lugar
                </strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  O topo é reservado para os produtos que os tutores realmente amam.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Perguntas Frequentes (FAQ) com Acessibilidade WCAG */}
      <section id="faq" className="container" aria-label="Perguntas frequentes sobre o PetRankings" style={{ scrollMarginTop: '100px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 800,
              color: 'var(--gold-700)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Tire Suas Dúvidas
          </span>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.4rem)', marginBottom: '10px' }}>
            Perguntas que Todo Tutor Cuidadoso Faz
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '1.05rem' }}>
            Explicamos de forma simples e transparente como funciona o PetRankings.
          </p>
        </div>

        <FaqAccordion faqs={faqs} />
      </section>
    </div>
  );
}
