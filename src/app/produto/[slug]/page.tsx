import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Leaf,
  PawPrint,
  FileText,
  Clock,
  Camera,
  Stethoscope,
  Info,
  Globe,
  Store,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import TransgenicIcon from '@/components/TransgenicIcon';
import prisma from '@/lib/prisma';
import { calcularNutrientesMS, calcularEnergiaMetabolizavel, getAbinpetStandard } from '@/lib/audit-engine';
import { ExtratoPilarItem } from '@/lib/audit-engine/types';
import { getFaixaVisual, formatarTermo } from '@/lib/formatters';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      commercialName: true,
      brand: true,
      editorialOpinion: true,
      frontLabelImageUrl: true,
    },
  });

  if (!product) {
    return { title: 'Produto Não Encontrado — PetRankings' };
  }

  return {
    title: `Avaliação Nutricional: ${product.commercialName} — PetRankings`,
    description:
      product.editorialOpinion ||
      `Laudo técnico documental de ${product.commercialName}. Avaliação nutricional em Matéria Seca conforme parâmetros da ABINPET e MAPA.`,
    alternates: {
      canonical: `/produto/${slug}`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      affiliateLinks: true,
    },
  });

  if (!product || !product.isPublished) {
    notFound();
  }

  // Conversão para Matéria Seca
  const ms = calcularNutrientesMS({
    umidadeMaxPct: product.moistureMaxPct,
    proteinaBrutaMinPct: product.crudeProteinMinPct,
    extratoEtereoMinPct: product.etherExtractMinPct,
    materiaFibrosaMaxPct: product.crudeFiberMaxPct,
    materiaMineralMaxPct: product.mineralMatterMaxPct,
    calcioMinPct: product.calciumMinPct,
    calcioMaxPct: product.calciumMaxPct,
    fosforoMinPct: product.phosphorusMinPct,
    sodioMinPct: product.sodiumMinPct,
    omega3MinPct: product.omega3MinPct,
  });

  const relacaoCaP = Number(
    (product.calciumMinPct / (product.phosphorusMinPct || 0.01)).toFixed(2)
  );

  // Parse dos ingredientes
  let parsedIngredients: string[] = [];
  try {
    parsedIngredients = Array.isArray(product.topIngredients)
      ? product.topIngredients
      : JSON.parse(product.topIngredients);
  } catch {
    parsedIngredients = product.topIngredients
      ? product.topIngredients.split(',').map((s) => s.trim())
      : [];
  }

  // Parse do extrato da análise de rótulo
  let extratoItens: ExtratoPilarItem[] = [];
  if (product.scoreBreakdown) {
    if (Array.isArray(product.scoreBreakdown)) {
      extratoItens = product.scoreBreakdown as any;
    } else if (Array.isArray((product.scoreBreakdown as any).extratoPontos)) {
      extratoItens = (product.scoreBreakdown as any).extratoPontos;
    }
  }

  const isCoadjuvante = product.legalCategory === 'ALIMENTO_COADJUVANTE';
  const isComplementar = product.legalCategory === 'ALIMENTO_COMPLEMENTAR';

  const tier = getFaixaVisual(product.classificationTier, isCoadjuvante, isComplementar);
  const isFilhote = product.lifeStage === 'CRESCIMENTO_INICIAL' || product.lifeStage === 'CRESCIMENTO_FINAL' || product.lifeStage === 'FILHOTE';
  const abinpetPadrao = getAbinpetStandard(
    product.species as any,
    isFilhote ? 'CRESCIMENTO_INICIAL' : 'ADULTO',
    product.foodType as any
  );

  // Estimativa de Energia Metabolizável (NRC/ABINPET - Seção 3.2 do DRS 8.0)
  const em = calcularEnergiaMetabolizavel(
    product.species as any,
    product.moistureMaxPct,
    product.crudeProteinMinPct,
    product.etherExtractMinPct,
    product.crudeFiberMaxPct,
    product.mineralMatterMaxPct
  );

  // Schema.org JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.commercialName,
    brand: { '@type': 'Brand', name: product.brand },
    image: product.frontLabelImageUrl || undefined,
    description: product.editorialOpinion || undefined,
    offers: product.affiliateLinks.length > 0 ? {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      offerCount: product.affiliateLinks.length,
      offers: product.affiliateLinks.map((a) => ({
        '@type': 'Offer',
        url: a.affiliateUrl || a.productUrl,
        seller: { '@type': 'Organization', name: a.store },
      })),
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ paddingBottom: '60px' }}>
        <div className="container" style={{ paddingTop: '32px' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: '20px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                color: 'var(--brand-forest-700)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar ao Índice Geral</span>
            </Link>
          </div>

          {/* CABEÇALHO DO LAUDO AUDITADO */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px 28px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '18px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                {product.frontLabelImageUrl && (
                  <div
                    style={{
                      position: 'relative',
                      width: '125px',
                      height: '160px',
                      flexShrink: 0,
                      backgroundColor: 'var(--bg-cream-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-cream)',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      src={product.frontLabelImageUrl}
                      alt={`Packshot oficial de ${product.commercialName}`}
                      fill
                      sizes="125px"
                      priority
                      style={{ objectFit: 'contain', padding: '6px' }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className={tier.badgeClass}>
                      {isComplementar ? <Sparkles size={13} /> : isCoadjuvante ? <Stethoscope size={13} /> : <ShieldCheck size={13} />}
                      {tier.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-cream-subtle)',
                        color: 'var(--text-muted)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-cream-light)',
                      }}
                    >
                      Espécie: {formatarTermo(product.species)} • Fase: {formatarTermo(product.lifeStage)}{product.breedSize && ` • ${formatarTermo(product.breedSize)}`} • Formato: {formatarTermo(product.foodType)}
                    </span>
                  </div>

                  <h1
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'clamp(1.25rem, 1.8vw, 1.55rem)',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      lineHeight: 1.25,
                      letterSpacing: '-0.3px',
                      marginBottom: '8px',
                    }}
                  >
                    {product.commercialName}
                  </h1>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '12px' }}>
                    <span>Marca:</span> <strong style={{ color: 'var(--text-main)' }}>{product.brand}</strong>{product.manufacturerLegalName ? ` • ${product.manufacturerLegalName}` : ''}
                  </div>

                  {product.editorialOpinion && (
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-body)',
                        fontStyle: 'italic',
                        lineHeight: 1.55,
                        textAlign: 'left',
                        borderLeft: '3px solid var(--gold-500)',
                        backgroundColor: 'var(--bg-cream-subtle)',
                        padding: '8px 12px',
                        borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                        marginBottom: '12px',
                      }}
                    >
                      "{product.editorialOpinion}"
                    </p>
                  )}

                  {product.affiliateLinks && product.affiliateLinks.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href="#onde-comprar"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          backgroundColor: 'var(--brand-forest-50)',
                          border: '1px solid var(--border-cream)',
                          color: 'var(--brand-forest-800)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <Store size={13} color="var(--brand-forest-700)" />
                        <span>Disponível em {product.affiliateLinks.length} {product.affiliateLinks.length === 1 ? 'loja' : 'lojas'} • Ver Ofertas</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Score Grande Auditado / Status */}
              {!isCoadjuvante && !isComplementar && product.scoreTotal !== null ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 22px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: tier.bgColor,
                    border: `2px solid ${tier.borderColor}`,
                    textAlign: 'center',
                    minWidth: '150px',
                  }}
                >
                  <span style={{ fontSize: '0.70rem', fontWeight: 800, textTransform: 'uppercase', color: tier.color, letterSpacing: '0.5px' }}>
                    Índice de Conformidade
                  </span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 900, color: tier.color, lineHeight: 1, margin: '2px 0' }}>
                    {product.scoreTotal}
                  </span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: tier.color }}>
                    de 100 pontos
                  </span>
                </div>
              ) : isComplementar ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fdf4ff',
                    border: '1.5px solid #f5d0fe',
                    textAlign: 'center',
                    minWidth: '150px',
                  }}
                >
                  <Sparkles size={24} color="#a21caf" style={{ marginBottom: '4px' }} />
                  <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#701a75' }}>
                    Alimento Complementar
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#86198f', marginTop: '2px' }}>
                    Uso Combinado (MAPA)
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#eef2ff',
                    border: '1.5px solid #818cf8',
                    textAlign: 'center',
                    minWidth: '150px',
                  }}
                >
                  <Stethoscope size={24} color="#4338ca" style={{ marginBottom: '4px' }} />
                  <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#3730a3' }}>
                    Finalidade Clínica
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#4f46e5', marginTop: '2px' }}>
                    {product.coadjuvanteCondition}
                  </span>
                </div>
              )}
            </div>

            {/* BOTÃO VISÍVEL NOVO LOTE / RETIFICAÇÃO */}
            <div
              style={{
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-cream-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                Fonte Documental: <strong>Website Oficial da Marca</strong>
              </div>

              <Link
                href={`/fabricante?produto=${product.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--gold-50)',
                  border: '1.5px solid var(--gold-500)',
                  color: 'var(--gold-800)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <Building2 size={14} />
                <span>Fabricante: Solicite Atualização de Dados Oficiais</span>
              </Link>
            </div>
          </div>

          {/* GRID DE DUAS COLUNAS: CUSTÓDIA DOCUMENTAL E EXTRATO DA ANÁLISE */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            {/* PAINEL DE CUSTÓDIA DIGITAL E EVIDÊNCIA DO FABRICANTE */}
            <section className="custodia-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} color="var(--brand-forest-700)" />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                  Custódia e Rastreabilidade Digital
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Especificações extraídas do website oficial do fabricante, com amparo probatório nos Arts. 30 e 31 do CDC.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Fonte Oficial:</span>
                  {product.sourceUrl ? (
                    <a
                      href={product.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--brand-forest-700)', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Website da Marca</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <strong style={{ color: 'var(--text-main)' }}>Website do Fabricante</strong>
                  )}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Data da Coleta:</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {new Date(product.labelCollectionDate).toLocaleDateString('pt-BR')}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Marca:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{product.brand}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Curadoria Responsável:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{product.curatorResponsible || 'Curadoria Oficial'}</strong>
                </div>
              </div>

              {/* Ações de Custódia Probatória Digital */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {product.sourceDocumentUrl && (
                  <a
                    href={product.sourceDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="var(--brand-forest-700)" />
                      <span>Comprovante Oficial da Ficha Técnica (PDF)</span>
                    </span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </section>

            {/* EXTRATO DA ANÁLISE DE RÓTULO DOS 4 PILARES */}
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '24px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <PawPrint size={20} color="var(--brand-forest-700)" fill="currentColor" strokeWidth={1.5} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                  Extrato da Avaliação Nutricional (0 a 100)
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Demonstrativo pilar a pilar da pontuação obtida segundo o algoritmo determinístico.
              </p>

              {extratoItens.length > 0 && !isComplementar && !isCoadjuvante ? (
                <div>
                  {extratoItens.map((item, idx) => (
                    <div key={idx} className="extrato-item">
                      <div className="extrato-item-header">
                        <span>Pilar: {item.pilar}</span>
                        <span className="extrato-item-points">
                          {item.pontos_obtidos} / {item.pontos_max} pts
                        </span>
                      </div>
                      <p className="extrato-item-just">{item.justificativa}</p>
                    </div>
                  ))}
                </div>
              ) : isComplementar ? (
                <div style={{ fontSize: '0.85rem', color: '#701a75', backgroundColor: '#fdf4ff', padding: '18px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #c026d3', lineHeight: 1.6 }}>
                  <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '6px' }}>
                    Alimento Complementar / Específico (Topper / Petisco):
                  </strong>
                  Este produto é classificado pelo MAPA como <em>complemento alimentar para hidratação e agrado</em> à base de filés nobres em caldo, formulado sem premix mineral completo. Deve ser oferecido associado a um alimento completo. Em consonância com a regulação zootécnica, <strong>não possui nota comparativa de ração completa diária</strong>.
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px 0' }}>
                  Alimento coadjuvante sem pontuação comparativa de ranking.
                </div>
              )}
            </section>
          </div>

          {/* TABELA BROMATOLÓGICA: MATÉRIA NATURAL (MN) vs MATÉRIA SECA (MS) */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '28px',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <FileText size={20} color="var(--brand-forest-700)" />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                Níveis de Garantia: Matéria Natural (MN) vs Matéria Seca (MS)
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {product.foodType === 'UMIDO'
                ? `A conversão para Matéria Seca desconsidera a elevada umidade do produto (${product.moistureMaxPct.toFixed(1)}%). Para alimentos úmidos, a conformidade de minerais e segurança de cálcio é aferida consoante as diretrizes internacionais da FEDIAF/NRC e o Manual ABINPET 11ª Edição.`
                : `A conversão para Matéria Seca desconsidera a umidade do produto (${product.moistureMaxPct.toFixed(1)}%), permitindo comparar a densidade real dos nutrientes contra os limites oficiais da 11ª Edição do Manual ABINPET.`}
            </p>

            <div className="table-nutri-wrapper">
              <table className="table-nutri">
                <thead>
                  <tr>
                    <th>Nutriente / Parâmetro</th>
                    <th>Garantia Declarada (Matéria Natural)</th>
                    <th>Calculado em Matéria Seca (MS)</th>
                    <th>Parâmetro de Referência {product.foodType === 'UMIDO' ? 'ABINPET / FEDIAF' : 'ABINPET 11ª Ed.'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Umidade (Máx.)</strong></td>
                    <td>{product.moistureMaxPct.toFixed(1)}%</td>
                    <td>0.0% (Base Seca)</td>
                    <td>{product.foodType === 'UMIDO' ? 'Padrão sachê/lata úmido: 80-88%' : 'Padrão industrial: até 10-12%'}</td>
                  </tr>
                  <tr>
                    <td><strong>Proteína Bruta (Mín.)</strong></td>
                    <td>{product.crudeProteinMinPct.toFixed(1)}%</td>
                    <td><strong style={{ color: '#065f46' }}>{ms.proteinaBrutaPct.toFixed(2)}%</strong></td>
                    <td>Piso ABINPET: {abinpetPadrao.proteinaBrutaMinMS.toFixed(1)}% MS ({isFilhote ? 'Crescimento / Filhotes' : 'Manutenção'})</td>
                  </tr>
                  <tr>
                    <td><strong>Extrato Etéreo / Gordura (Mín.)</strong></td>
                    <td>{product.etherExtractMinPct.toFixed(1)}%</td>
                    <td><strong style={{ color: '#065f46' }}>{ms.extratoEtereoPct.toFixed(2)}%</strong></td>
                    <td>Piso ABINPET: {abinpetPadrao.extratoEtereoMinMS.toFixed(1)}% MS</td>
                  </tr>
                  <tr>
                    <td><strong>Matéria Fibrosa (Máx.)</strong></td>
                    <td>{product.crudeFiberMaxPct.toFixed(1)}%</td>
                    <td>{(product.crudeFiberMaxPct / ms.fatorMS).toFixed(2)}%</td>
                    <td>Controle de digestibilidade</td>
                  </tr>
                  <tr>
                    <td><strong>Matéria Mineral (Máx.)</strong></td>
                    <td>{product.mineralMatterMaxPct.toFixed(1)}%</td>
                    <td>{(product.mineralMatterMaxPct / ms.fatorMS).toFixed(2)}%</td>
                    <td>Máximo recomendado: até 8-10% MS</td>
                  </tr>
                  <tr>
                    <td><strong>Cálcio (Mín. / Máx.)</strong></td>
                    <td>
                      {product.calciumMinPct.toFixed(2)}%
                      {product.calciumMaxPct ? ` a ${product.calciumMaxPct.toFixed(2)}%` : ''}
                    </td>
                    <td>
                      {ms.calcioMinPct.toFixed(2)}%
                      {ms.calcioMaxPct ? ` a ${ms.calcioMaxPct.toFixed(2)}%` : ''}
                    </td>
                    <td>
                      {product.foodType === 'UMIDO'
                        ? `Faixa segura: ${abinpetPadrao.calcioMinMS.toFixed(2)}% a ${abinpetPadrao.calcioMaxSeguroMS.toFixed(2)}% MS (Diretriz Internacional FEDIAF / NRC para Alimentos Úmidos)`
                        : `Faixa segura: ${abinpetPadrao.calcioMinMS.toFixed(2)}% a ${abinpetPadrao.calcioMaxSeguroMS.toFixed(2)}% MS`}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Fósforo (Mín.)</strong></td>
                    <td>{product.phosphorusMinPct.toFixed(2)}%</td>
                    <td>{ms.fosforoMinPct.toFixed(2)}%</td>
                    <td>Piso seguro: {abinpetPadrao.fosforoMinMS.toFixed(2)}% MS</td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-cream-main)' }}>
                    <td><strong>Relação Cálcio : Fósforo (Ca:P)</strong></td>
                    <td colSpan={2}>
                      <strong style={{ fontSize: '0.98rem', color: relacaoCaP >= abinpetPadrao.relacaoCaPIdealMin && relacaoCaP <= abinpetPadrao.relacaoCaPIdealMax ? '#065f46' : '#92400e' }}>
                        {relacaoCaP}:1
                      </strong>
                    </td>
                    <td>Faixa Ideal: {abinpetPadrao.relacaoCaPIdealMin.toFixed(1)}:1 até {abinpetPadrao.relacaoCaPIdealMax.toFixed(1)}:1 ({isFilhote ? 'Filhotes' : 'Adultos'})</td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--brand-forest-50)' }}>
                    <td><strong>Energia Metabolizável Estimada (EM)</strong></td>
                    <td colSpan={2}>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--brand-forest-900)' }}>
                        {em.emKcalKg.toLocaleString('pt-BR')} kcal/kg
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        (ENN: {em.ennPct}% • CDE: {em.cdePct}%)
                      </span>
                    </td>
                    <td>Equação Preditiva NRC / Manual ABINPET</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* INGREDIENTES DECLARADOS E ADITIVOS */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '28px',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-forest-900)', marginBottom: '14px' }}>
              Composição e Ingredientes Declarados
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: product.antioxidantType === 'NATURAL' ? '#ecfdf5' : '#fffbeb',
                  color: product.antioxidantType === 'NATURAL' ? '#065f46' : '#92400e',
                  border: product.antioxidantType === 'NATURAL' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                {product.antioxidantType === 'NATURAL' ? (
                  <>
                    <Leaf size={14} color="#059669" />
                    <span>Conservantes 100% Naturais (Tocoferóis e Alecrim)</span>
                  </>
                ) : (
                  <>
                    <FlaskConical size={14} color="#d97706" />
                    <span>Conservantes Sintéticos (BHA/BHT)</span>
                  </>
                )}
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: product.containsGmo ? '#fef3c7' : '#f0fdf4',
                  color: product.containsGmo ? '#92400e' : '#166534',
                  border: product.containsGmo ? '1px solid #fde68a' : '1px solid #bbf7d0',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                {product.containsGmo ? (
                  <>
                    <TransgenicIcon size={14} />
                    <span>Contém Transgênicos {product.gmoIngredients ? `(${product.gmoIngredients})` : ''}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} color="#16a34a" />
                    <span>Livre de Transgênicos</span>
                  </>
                )}
              </span>

              {product.omega3MinPct && product.omega3MinPct > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  Ômega-3 Declarado: {product.omega3MinPct.toFixed(2)}%
                </span>
              )}
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-cream-main)',
                borderRadius: 'var(--radius-sm)',
                padding: '18px 20px',
                fontSize: '0.88rem',
                color: 'var(--text-body)',
                lineHeight: 1.7,
                textAlign: 'justify',
                textJustify: 'inter-word',
                border: '1px solid var(--border-cream-light)',
              }}
            >
              <strong style={{ color: 'var(--brand-forest-900)', display: 'block', marginBottom: '8px' }}>
                Composição Básica Declarada pelo Fabricante (Ordem Decrescente de Inclusão — IN MAPA nº 30/2009):
              </strong>
              {parsedIngredients.join(', ')}.
            </div>
          </section>

          {/* ONDE ENCONTRAR / AFILIADOS (SE DISPONÍVEL) */}
          {product.affiliateLinks && product.affiliateLinks.length > 0 && (
            <section
              id="onde-comprar"
              style={{
                scrollMarginTop: '100px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
                Onde Encontrar este Produto
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Consulte disponibilidade e ofertas nos grandes varejistas e lojas parceiras:
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {product.affiliateLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.affiliateUrl || link.productUrl}
                    target="_blank"
                    rel="nofollow noopener sponsored"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--brand-forest-900)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Ver na {link.store}</span>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
