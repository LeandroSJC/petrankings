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
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { calcularNutrientesMS, calcularEnergiaMetabolizavel } from '@/lib/audit-engine';
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
    extratoItens = Array.isArray(product.scoreBreakdown)
      ? (product.scoreBreakdown as any)
      : [];
  }

  const isCoadjuvante = product.legalCategory === 'ALIMENTO_COADJUVANTE';

  const tier = getFaixaVisual(product.classificationTier, isCoadjuvante);

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
              padding: '32px',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '24px',
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className={tier.badgeClass}>
                    {isCoadjuvante ? <Stethoscope size={14} /> : <ShieldCheck size={14} />}
                    {tier.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-cream-subtle)',
                      color: 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    Espécie: {formatarTermo(product.species)} • Fase: {formatarTermo(product.lifeStage)}{product.breedSize && ` • ${formatarTermo(product.breedSize)}`} • Formato: {formatarTermo(product.foodType)}
                  </span>
                </div>

                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.8rem, 3.2vw, 2.3rem)',
                    fontWeight: 900,
                    color: 'var(--brand-forest-900)',
                    lineHeight: 1.2,
                    marginBottom: '10px',
                  }}
                >
                  {product.commercialName}
                </h1>

                <div style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '16px' }}>
                  <strong>Marca:</strong> {product.brand}{product.manufacturerLegalName ? ` • ${product.manufacturerLegalName}` : ''}
                </div>

                {product.editorialOpinion && (
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6, borderLeft: '3px solid var(--gold-500)', paddingLeft: '14px' }}>
                    "{product.editorialOpinion}"
                  </p>
                )}
              </div>

              {/* Score Grande Auditado */}
              {!isCoadjuvante && product.scoreTotal !== null ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 32px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: tier.bgColor,
                    border: `2px solid ${tier.borderColor}`,
                    textAlign: 'center',
                    minWidth: '170px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: tier.color, letterSpacing: '0.5px' }}>
                    Índice de Conformidade
                  </span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '3.2rem', fontWeight: 900, color: tier.color, lineHeight: 1 }}>
                    {product.scoreTotal}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: tier.color }}>
                    de 100 pontos
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 28px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#eef2ff',
                    border: '2px solid #818cf8',
                    textAlign: 'center',
                  }}
                >
                  <Stethoscope size={32} color="#4338ca" style={{ marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#3730a3' }}>
                    Finalidade Clínica
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#4f46e5' }}>
                    {product.coadjuvanteCondition}
                  </span>
                </div>
              )}
            </div>

            {/* BOTÃO VISÍVEL NOVO LOTE / RETIFICAÇÃO */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-cream-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Fonte Documental: <strong>Website Oficial da Marca</strong>
              </div>

              <Link
                href={`/fabricante?produto=${product.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--gold-50)',
                  border: '1.5px solid var(--gold-500)',
                  color: 'var(--gold-800)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <Building2 size={16} />
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
                {product.sourceArchiveUrl && (
                  <a
                    href={product.sourceArchiveUrl}
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
                      backgroundColor: 'var(--bg-cream-subtle)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} color="var(--brand-forest-700)" />
                      <span>Snapshot no Wayback Machine (Archive.org)</span>
                    </span>
                    <ExternalLink size={12} />
                  </a>
                )}

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
                      <span>Comprovante da Ficha Técnica (PDF / Print)</span>
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

              {extratoItens.length > 0 ? (
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
              A conversão para Matéria Seca desconsidera a umidade do produto ({product.moistureMaxPct}%), permitindo comparar a densidade real dos nutrientes contra os limites oficiais da 11ª Edição do Manual ABINPET.
            </p>

            <div className="table-nutri-wrapper">
              <table className="table-nutri">
                <thead>
                  <tr>
                    <th>Nutriente / Parâmetro</th>
                    <th>Garantia Declarada (Matéria Natural)</th>
                    <th>Calculado em Matéria Seca (MS)</th>
                    <th>Parâmetro de Referência ABINPET 11ª Ed.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Umidade (Máx.)</strong></td>
                    <td>{product.moistureMaxPct.toFixed(1)}%</td>
                    <td>0.0% (Base Seca)</td>
                    <td>Padrão industrial: até 10-12%</td>
                  </tr>
                  <tr>
                    <td><strong>Proteína Bruta (Mín.)</strong></td>
                    <td>{product.crudeProteinMinPct.toFixed(1)}%</td>
                    <td><strong style={{ color: '#065f46' }}>{ms.proteinaBrutaPct.toFixed(2)}%</strong></td>
                    <td>Piso ABINPET: {product.species === 'CAO' ? '18.0%' : '26.0%'} MS (Manutenção)</td>
                  </tr>
                  <tr>
                    <td><strong>Extrato Etéreo / Gordura (Mín.)</strong></td>
                    <td>{product.etherExtractMinPct.toFixed(1)}%</td>
                    <td><strong style={{ color: '#065f46' }}>{ms.extratoEtereoPct.toFixed(2)}%</strong></td>
                    <td>Piso ABINPET: {product.species === 'CAO' ? '5.5%' : '9.0%'} MS</td>
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
                    <td>Faixa segura: {product.species === 'CAO' ? '0,50% a 2,50%' : '0,60% a 2,00%'} MS</td>
                  </tr>
                  <tr>
                    <td><strong>Fósforo (Mín.)</strong></td>
                    <td>{product.phosphorusMinPct.toFixed(2)}%</td>
                    <td>{ms.fosforoMinPct.toFixed(2)}%</td>
                    <td>Piso seguro: {product.species === 'CAO' ? '0,40%' : '0,50%'} MS</td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-cream-main)' }}>
                    <td><strong>Relação Cálcio : Fósforo (Ca:P)</strong></td>
                    <td colSpan={2}>
                      <strong style={{ fontSize: '0.98rem', color: relacaoCaP >= 1.1 && relacaoCaP <= 1.6 ? '#065f46' : '#92400e' }}>
                        {relacaoCaP}:1
                      </strong>
                    </td>
                    <td>Faixa Ideal: 1,1:1 até 1,6:1 (Tolerância: 1,0:1 até 2,0:1)</td>
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
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <Leaf size={14} />
                Conservantes: {product.antioxidantType === 'NATURAL' ? '100% Naturais (Tocoferóis e Alecrim)' : 'Sintéticos (BHA/BHT)'}
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
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                OGM: {product.containsGmo ? `Contém Transgênicos (${product.gmoIngredients || 'Milho/Soja'})` : 'Livre de Transgênicos'}
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
                padding: '16px',
                fontSize: '0.88rem',
                color: 'var(--text-body)',
                lineHeight: 1.6,
                border: '1px solid var(--border-cream-light)',
              }}
            >
              <strong style={{ color: 'var(--brand-forest-900)', display: 'block', marginBottom: '6px' }}>
                Lista Completa dos Principais Ingredientes (Ordem Decrescente de Quantidade - IN MAPA 30/2009):
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
                Consulte disponibilidade e ofertas nas principais lojas especializadas do Brasil:
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
                    <span>Ver na {link.store.toUpperCase()}</span>
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
