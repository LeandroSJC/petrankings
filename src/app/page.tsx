import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PawPrint,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  FileText,
  HelpCircle,
  Stethoscope,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import HomeAuditView, { ProductItemData } from '@/components/HomeAuditView';
import FaqAccordion from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'Comparador Nutricional de Rações para Cães e Gatos — PetRankings',
  description:
    'Comparador nutricional independente de rações para cães e gatos registradas no Brasil. Níveis de proteína e minerais na Matéria Seca (MS) e ingredientes dos sites oficiais dos fabricantes.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
    title: 'Comparador Nutricional de Rações para Cães e Gatos — PetRankings',
    description:
      'Compare a qualidade real da ração do seu pet com análises em Matéria Seca (MS) baseadas nos sites oficiais dos fabricantes.',
  },
};

export const revalidate = 60;

export default async function HomePage() {
  // Buscar produtos publicados com os links de afiliados
  const rawProducts = await prisma.product.findMany({
    where: { isPublished: true },
    include: {
      affiliateLinks: {
        select: {
          store: true,
          productUrl: true,
          affiliateUrl: true,
        },
      },
    },
    orderBy: [
      { scoreTotal: 'desc' },
      { commercialName: 'asc' },
    ],
  });

  const products: ProductItemData[] = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    commercialName: p.commercialName,
    brand: p.brand,
    manufacturerLegalName: p.manufacturerLegalName,
    legalCategory: p.legalCategory,
    species: p.species,
    lifeStage: p.lifeStage,
    breedSize: p.breedSize,
    foodType: p.foodType,
    coadjuvanteCondition: p.coadjuvanteCondition,
    sourceUrl: p.sourceUrl,
    sourceArchiveUrl: p.sourceArchiveUrl,
    sourceDocumentUrl: p.sourceDocumentUrl,
    analyzedBatch: p.analyzedBatch,
    labelCollectionDate: p.labelCollectionDate,
    frontLabelImageUrl: p.frontLabelImageUrl,
    backLabelImageUrl: p.backLabelImageUrl,
    moistureMaxPct: p.moistureMaxPct,
    crudeProteinMinPct: p.crudeProteinMinPct,
    etherExtractMinPct: p.etherExtractMinPct,
    crudeFiberMaxPct: p.crudeFiberMaxPct,
    mineralMatterMaxPct: p.mineralMatterMaxPct,
    calciumMinPct: p.calciumMinPct,
    calciumMaxPct: p.calciumMaxPct,
    phosphorusMinPct: p.phosphorusMinPct,
    sodiumMinPct: p.sodiumMinPct,
    omega3MinPct: p.omega3MinPct,
    meatClaimType: p.meatClaimType,
    containsGmo: p.containsGmo,
    gmoIngredients: p.gmoIngredients,
    antioxidantType: p.antioxidantType,
    topIngredients: p.topIngredients,
    editorialOpinion: p.editorialOpinion,
    scoreTotal: p.scoreTotal,
    classificationTier: p.classificationTier,
    scoreBreakdown: p.scoreBreakdown,
    affiliateLinks: p.affiliateLinks,
  }));

  // FAQ Institucional e Metodológica
  const faqs = [
    {
      q: 'Como funciona a Avaliação Nutricional do PetRankings?',
      a: 'É uma metodologia técnica e determinística que avalia as informações nutricionais divulgadas nos sites oficiais dos fabricantes de alimentos para cães e gatos sob 4 pilares: adequação nutricional em Matéria Seca (MS), equilíbrio Cálcio:Fósforo (Ca:P), nobreza dos primeiros ingredientes declarados e transparência com aditivos e conservantes naturais.',
    },
    {
      q: 'Por que os cálculos são feitos na Matéria Seca (MS) e não na Matéria Natural (MN)?',
      a: 'A umidade dilui as porcentagens dos nutrientes informadas nas embalagens e nas páginas dos produtos. Ao converter os níveis de garantia para Matéria Seca (eliminando a água), é possível confrontar cientificamente os teores reais com as tabelas de exigências mínimas da 11ª Edição do Manual Pet Food Brasil (ABINPET).',
    },
    {
      q: 'Como são tratados os alimentos coadjuvantes (prescrição veterinária)?',
      a: 'Alimentos com indicação terapêutica (como dietas renais, urinárias, gastrointestinais e de obesidade) possuem formulações intencionalmente modificadas para fins clínicos e NUNCA competem com alimentos de manutenção sadia. Eles possuem catálogo isolado sem ranking comparativo.',
    },
    {
      q: 'O portal realiza testes em laboratório ou exige envio de embalagens físicas?',
      a: 'Não. O portal realiza estritamente o confronto técnico e documental das garantias e composições declaradas publicamente pelos próprios fabricantes nos sites oficiais de suas marcas. Cada produto catalogado possui registro de custódia documental com a URL da página oficial do fabricante e o comprovante da ficha técnica oficial em PDF arquivado, com pleno amparo nos Arts. 30 e 31 do Código de Defesa do Consumidor e parâmetros científicos da ABINPET/MAPA.',
    },
    {
      q: 'Como fabricantes podem retificar ou atualizar dados cadastrados?',
      a: 'Fabricantes possuem canal institucional prioritário (Right of Reply) com prazo de atendimento de até 5 dias úteis para comunicação de novos links de produtos, atualização de composições declaradas ou notificação de reformulação de fórmulas.',
    },
  ];

  // Schema.org JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Avaliação Nutricional de Pet Food — PetRankings',
    description:
      'Análise técnica comparativa de alimentos para cães e gatos segundo parâmetros do Manual ABINPET 11ª Edição e MAPA.',
    itemListElement: products.slice(0, 10).map((prod, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: prod.commercialName,
        brand: { '@type': 'Brand', name: prod.brand },
        image: prod.frontLabelImageUrl || undefined,
        description: prod.editorialOpinion || undefined,
        aggregateRating: prod.scoreTotal !== null ? {
          '@type': 'AggregateRating',
          ratingValue: (prod.scoreTotal / 20).toFixed(1), // Converte para escala 0 a 5
          bestRating: '5',
          worstRating: '1',
          ratingCount: 1,
        } : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ paddingBottom: '60px' }}>
        {/* HERO EDITORIAL COMPACTO & ACOLHEDOR */}
        <section
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-cream)',
            padding: '24px 0 18px 0',
            backgroundImage:
              'radial-gradient(ellipse at 50% 0%, rgba(26, 136, 95, 0.05) 0%, transparent 70%)',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: '920px', margin: '0 auto', textAlign: 'center' }}>
              {/* Título Natural, Proporcional e Convidativo */}
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.35rem, 2.2vw, 1.75rem)',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.4px',
                  marginBottom: '8px',
                }}
              >
                Comparador Nutricional de Rações para Cães e Gatos
              </h1>

              <p
                style={{
                  fontSize: 'clamp(0.92rem, 1.2vw, 1rem)',
                  color: 'var(--text-body)',
                  lineHeight: 1.55,
                  marginBottom: '14px',
                  maxWidth: '860px',
                  margin: '0 auto 14px auto',
                }}
              >
                <span style={{ display: 'block' }}>
                  Análise transparente e independente da composição das rações registradas no Brasil.
                </span>
                <span style={{ display: 'block' }}>
                  Nutrientes convertidos para <strong>Matéria Seca (MS)</strong> a partir dos sites oficiais dos fabricantes.
                </span>
              </p>

              {/* Destaques de Confiança e Metodologia */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  fontSize: '0.80rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--brand-forest-900)', whiteSpace: 'nowrap' }}>
                  <CheckCircle2 size={14} color="var(--brand-forest-700)" />
                  100% Baseado nos Sites Oficiais dos Fabricantes
                </span>
                <span style={{ color: 'var(--border-cream-dark)' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--brand-forest-900)', whiteSpace: 'nowrap' }}>
                  <ShieldCheck size={14} color="var(--brand-forest-700)" />
                  Proteína e Minerais em Base Seca
                </span>
                <span style={{ color: 'var(--border-cream-dark)' }}>•</span>
                <Link
                  href="/sobre"
                  style={{
                    color: 'var(--brand-forest-700)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>Conheça os critérios da nota →</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* COMPONENTE INTERATIVO DE AUDITORIA & LISTAGEM COM FILTROS */}
        <section aria-labelledby="catalogo-heading" className="container" style={{ marginTop: '22px' }}>
          <h2 id="catalogo-heading" className="sr-only">
            Catálogo e Avaliações Nutricionais de Alimentos
          </h2>
          <HomeAuditView initialProducts={products} />
        </section>

        {/* RIGHT OF REPLY / GOVERNANÇA INSTITUCIONAL */}
        <section
          style={{
            backgroundColor: 'var(--brand-forest-900)',
            color: '#ffffff',
            padding: '50px 0',
            marginTop: '60px',
            borderTop: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--gold-400)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '10px',
                  }}
                >
                  <Building2 size={16} />
                  <span>Módulo de Governança Institucional</span>
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    marginBottom: '14px',
                    color: '#ffffff',
                  }}
                >
                  Canal Aberto para Fabricantes e Responsáveis Técnicos (Right of Reply)
                </h2>
                <p style={{ color: '#cbd5e1', fontSize: '0.94rem', lineHeight: 1.65 }}>
                  Para resguardar a boa-fé e a máxima fidelidade técnica aos dados públicos, fabricantes e marcas podem solicitar a atualização de dados cadastrados a qualquer momento mediante o envio da URL oficial da página do produto atualizada, comunicação de reformulação ou contraprova documental.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileCheck2 size={24} color="var(--gold-400)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', color: '#ffffff' }}>
                      SLA Institucional de 5 Dias Úteis
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Análise técnica criteriosa com conferência na fonte oficial
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Requisitos: Identificação do solicitante corporativo, nome da marca e URL da página oficial do produto no website do fabricante.
                </p>

                <Link
                  href="/fabricante"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 22px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--gold-500)',
                    color: '#082115',
                    fontSize: '0.90rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <span>Fabricante: Solicite Atualização de Dados Oficiais</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PERGUNTAS FREQUENTES (FAQ) METODOLÓGICAS */}
        <section style={{ marginTop: '60px' }} id="faq">
          <div className="container" style={{ maxWidth: '820px' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--brand-forest-700)',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                <HelpCircle size={16} />
                <span>Metodologia e Esclarecimentos</span>
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                }}
              >
                Perguntas Frequentes sobre a Avaliação Nutricional
              </h2>
            </div>

            <FaqAccordion faqs={faqs} />
          </div>
        </section>
      </main>
    </>
  );
}
