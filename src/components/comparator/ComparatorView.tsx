'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Plus,
  X,
  Share2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FlaskConical,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Camera,
  Info,
  ArrowRight,
  Store,
} from 'lucide-react';
import TransgenicIcon from '@/components/TransgenicIcon';
import ProductSearchModal from './ProductSearchModal';
import {
  ComparedProduct,
  ComparisonSynthesis,
  ComparisonPreset,
  POPULAR_COMPARISON_PRESETS,
  generateComparisonSynthesis,
} from '@/lib/comparator';

interface ComparatorViewProps {
  initialProducts: ComparedProduct[];
}

export default function ComparatorView({ initialProducts }: ComparatorViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Preenche até 3 slots (null para slots vazios)
  const [activeModalSlot, setActiveModalSlot] = useState<number | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Produtos atuais indexados nos slots 0, 1 e 2
  const slotProducts: Array<ComparedProduct | null> = [
    initialProducts[0] || null,
    initialProducts[1] || null,
    initialProducts[2] || null,
  ];

  const populatedProducts = slotProducts.filter((p): p is ComparedProduct => p !== null);
  const synthesis = generateComparisonSynthesis(populatedProducts);
  const selectedSlugs = populatedProducts.map((p) => p.slug);

  // Atualiza a URL mantendo a navegação do App Router
  const updateUrlWithSlugs = (slugs: string[]) => {
    const params = new URLSearchParams();
    if (slugs[0]) params.set('p1', slugs[0]);
    if (slugs[1]) params.set('p2', slugs[1]);
    if (slugs[2]) params.set('p3', slugs[2]);

    const queryString = params.toString();
    const targetUrl = queryString ? `/comparar?${queryString}` : '/comparar';

    startTransition(() => {
      router.push(targetUrl, { scroll: false });
    });
  };

  const handleSelectProduct = (newSlug: string, slotIdx: number) => {
    const newSlugs = [...selectedSlugs];
    if (slotIdx < newSlugs.length) {
      newSlugs[slotIdx] = newSlug;
    } else {
      newSlugs.push(newSlug);
    }
    setActiveModalSlot(null);
    updateUrlWithSlugs(newSlugs);
  };

  const handleRemoveSlot = (slotIdx: number) => {
    const newSlugs = selectedSlugs.filter((_, idx) => idx !== slotIdx);
    updateUrlWithSlugs(newSlugs);
  };

  const handleClearAll = () => {
    updateUrlWithSlugs([]);
  };

  const handleSelectPreset = (preset: ComparisonPreset) => {
    updateUrlWithSlugs([preset.p1, preset.p2]);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  // Helper para determinar se um valor de proteína MS é o maior do grupo
  const isHighestProtein = (product: ComparedProduct) => {
    if (populatedProducts.length < 2) return false;
    return product.slug === synthesis.highestProteinSlug;
  };

  // Helper para determinar se um valor de cinzas MS é o menor do grupo
  const isLowestAsh = (product: ComparedProduct) => {
    if (populatedProducts.length < 2) return false;
    return product.slug === synthesis.lowestAshSlug;
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Barra de Ações Superiores & Presets Rápidos */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px 18px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-cream)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Duelos Frequentes:
          </span>
          {POPULAR_COMPARISON_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-cream)',
                color: 'var(--brand-forest-800)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{preset.species === 'CAO' ? '🐕' : '🐈'}</span>
              <span>{preset.title}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {populatedProducts.length > 0 && (
            <>
              <button
                onClick={handleCopyLink}
                aria-label="Copiar link do comparativo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: copiedToast ? 'var(--brand-forest-50)' : '#ffffff',
                  border: '1px solid',
                  borderColor: copiedToast ? 'var(--brand-forest-600)' : 'var(--border-cream-dark)',
                  color: copiedToast ? 'var(--brand-forest-700)' : 'var(--text-body)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedToast ? <CheckCircle2 size={14} color="var(--brand-forest-600)" /> : <Share2 size={14} />}
                <span>{copiedToast ? 'Link copiado!' : 'Compartilhar'}</span>
              </button>

              <button
                onClick={handleClearAll}
                aria-label="Limpar todos os slots"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-cream)',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Limpar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* AVISO DE COMPATIBILIDADE ZOOTÉCNICA SE HOUVER MISTURA DE ESPÉCIES/FASES */}
      {synthesis.hasDifferentSpecies && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            marginBottom: '20px',
            fontSize: '0.84rem',
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Atenção à Comparação entre Espécies Diferentes:</strong> Você está comparando um alimento formulado para cães com outro desenvolvido para gatos. Carnívoros estritos (felinos) possuem exigências bromatológicas obrigatórias substancialmente superiores em proteína, gordura e aminoácidos essenciais (como a taurina) em relação aos cães.
          </div>
        </div>
      )}

      {/* SÍNTESE ANALÍTICA & VEREDITO DO CONFRONTO (QUANDO 2 OU MAIS PRODUTOS) */}
      {populatedProducts.length >= 2 && synthesis.summaryBullets.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'var(--brand-forest-700)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale size={15} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                margin: 0,
              }}
            >
              Síntese do confronto bromatológico
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            {synthesis.summaryBullets.map((bullet, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  color: 'var(--text-body)',
                }}
              >
                <CheckCircle2 size={16} color="var(--brand-forest-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER DOS SLOTS DE PRODUTOS (CARDS ELEVADOS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[0, 1, 2].map((slotIdx) => {
          const product = slotProducts[slotIdx];

          if (!product) {
            return (
              <div
                key={`empty-slot-${slotIdx}`}
                style={{
                  border: '2px dashed var(--border-cream-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: '32px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  minHeight: '260px',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--brand-forest-50)',
                    border: '1px solid var(--brand-forest-200)',
                    color: 'var(--brand-forest-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Plus size={22} />
                </div>
                <span
                  style={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  Slot {slotIdx + 1}
                </span>
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: 'var(--brand-forest-900)',
                    margin: '0 0 14px',
                  }}
                >
                  {slotIdx === 0
                    ? 'Selecione o 1º alimento'
                    : slotIdx === 1
                    ? 'Selecione o 2º alimento'
                    : 'Adicionar 3º alimento (opcional)'}
                </p>
                <button
                  onClick={() => setActiveModalSlot(slotIdx)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--brand-forest-700)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={15} />
                  <span>Selecionar Ração</span>
                </button>
              </div>
            );
          }

          return (
            <div
              key={`product-slot-${product.id}`}
              style={{
                position: 'relative',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Top Slot Header: Etiqueta e Botões de Trocar/Remover */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--brand-forest-700)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--brand-forest-50)',
                    border: '1px solid var(--brand-forest-200)',
                  }}
                >
                  Alimento {String.fromCharCode(65 + slotIdx)}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setActiveModalSlot(slotIdx)}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--brand-forest-800)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-cream)',
                      cursor: 'pointer',
                    }}
                  >
                    Trocar
                  </button>
                  <button
                    onClick={() => handleRemoveSlot(slotIdx)}
                    aria-label={`Remover ${product.commercialName} da comparação`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--text-muted)',
                      backgroundColor: 'transparent',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Packshot Image */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                {product.frontLabelImageUrl ? (
                  <Image
                    src={product.frontLabelImageUrl}
                    alt={product.commercialName}
                    fill
                    sizes="240px"
                    style={{ objectFit: 'contain', padding: '10px' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    <Camera size={24} style={{ margin: '0 auto 4px', display: 'block' }} />
                    Ficha Coletada
                  </div>
                )}
              </div>

              {/* Informações Básicas */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: product.species === 'CAO' ? 'var(--dog-accent-bg)' : 'var(--cat-accent-bg)',
                      color: product.species === 'CAO' ? 'var(--dog-accent-text)' : 'var(--cat-accent-text)',
                      border: `1px solid ${product.species === 'CAO' ? 'var(--dog-accent-border)' : 'var(--cat-accent-border)'}`,
                    }}
                  >
                    {product.species === 'CAO' ? '🐕 Cão' : '🐈 Gato'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {product.brand}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.94rem',
                    fontWeight: 800,
                    color: 'var(--brand-forest-900)',
                    lineHeight: 1.3,
                    margin: '0 0 6px',
                    minHeight: '2.6em',
                  }}
                >
                  {product.commercialName}
                </h3>
              </div>

              {/* Score do PetRankings */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: product.tierBgColor,
                  border: `1px solid ${product.tierBorderColor}`,
                  marginBottom: '14px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, color: product.tierTextColor, display: 'block' }}>
                    Classificação
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: product.tierTextColor }}>
                    {product.tierLabel}
                  </span>
                </div>
                {product.scoreTotal !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: product.tierTextColor, fontFamily: 'var(--font-heading)' }}>
                      {product.scoreTotal}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: product.tierTextColor, fontWeight: 700 }}>
                      /100
                    </span>
                  </div>
                )}
              </div>

              {/* Link para a Avaliação Técnica Completa */}
              <div style={{ marginTop: 'auto' }}>
                <Link
                  href={`/produto/${product.slug}`}
                  target="_blank"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-cream-dark)',
                    color: 'var(--brand-forest-900)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Ver Avaliação Técnica Completa</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* TABELA COMPARATIVA BROMATOLÓGICA (SE HOUVER AO MENOS 1 PRODUTO) */}
      {populatedProducts.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Cabeçalho da Tabela */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-cream)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.70rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--brand-forest-700)', display: 'block' }}>
                Confronto Lado a Lado
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.10rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                Níveis de garantia em Matéria Seca (MS) e ingredientes
              </h2>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Base: Manual ABINPET 11ª Edição & Rótulos Oficiais
            </span>
          </div>

          {/* Container Responsivo da Tabela com Scroll Horizontal Suave */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                fontSize: '0.84rem',
                minWidth: '680px',
              }}
            >
              <colgroup>
                <col style={{ width: populatedProducts.length === 3 ? '24%' : '28%' }} />
                {populatedProducts.map((p) => (
                  <col
                    key={`col-${p.id}`}
                    style={{
                      width: `${(100 - (populatedProducts.length === 3 ? 24 : 28)) / populatedProducts.length}%`,
                    }}
                  />
                ))}
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-cream)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 18px',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      wordBreak: 'break-word',
                    }}
                  >
                    Parâmetro Bromatológico
                  </th>
                  {populatedProducts.map((p, idx) => (
                    <th
                      key={p.id}
                      style={{
                        textAlign: 'left',
                        padding: '12px 18px',
                        color: 'var(--brand-forest-900)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        borderLeft: '1px solid var(--border-cream)',
                        wordBreak: 'break-word',
                      }}
                    >
                      Alimento {String.fromCharCode(65 + idx)}: {p.brand}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* GRUPO 1: MATÉRIA SECA (MS) */}
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-cream)' }}>
                  <td
                    colSpan={populatedProducts.length + 1}
                    style={{
                      padding: '10px 18px',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    1. Densidade Real de Nutrientes na Matéria Seca (MS)
                  </td>
                </tr>

                {/* Proteína Bruta MS */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Proteína Bruta Mínima (MS)</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Teor real desconsiderando a água</span>
                  </td>
                  {populatedProducts.map((p) => {
                    const isLeader = isHighestProtein(p);
                    return (
                      <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.0rem', fontWeight: 800, color: isLeader ? 'var(--brand-forest-700)' : 'var(--text-main)' }}>
                            {p.ms.proteinaBrutaPct.toFixed(1)}% MS
                          </span>
                          {isLeader && (
                            <span
                              style={{
                                fontSize: '0.64rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--brand-forest-50)',
                                color: 'var(--brand-forest-700)',
                                border: '1px solid var(--brand-forest-200)',
                              }}
                            >
                              Maior Teor
                            </span>
                          )}
                        </div>
                        {/* Barra visual de proteína */}
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'var(--bg-muted)',
                            borderRadius: '3px',
                            marginTop: '6px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(Math.max((p.ms.proteinaBrutaPct / 45) * 100, 10), 100)}%`,
                              height: '100%',
                              backgroundColor: isLeader ? 'var(--brand-forest-600)' : 'var(--silver-500)',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Extrato Etéreo (Gordura) MS */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Gordura / Extrato Etéreo Mínimo (MS)</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Fonte calórica e lipídios vitais</span>
                  </td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {p.ms.extratoEtereoPct.toFixed(1)}% MS
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Matéria Fibrosa MS */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Matéria Fibrosa / Fibra Máxima (MS)</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Saciedade e trânsito intestinal</span>
                  </td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.ms.materiaFibrosaPct.toFixed(1)}% MS
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Matéria Mineral (Cinzas) MS */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Matéria Mineral / Cinzas Máxima (MS)</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Menor cinza = menor presença de ossos</span>
                  </td>
                  {populatedProducts.map((p) => {
                    const isPurer = isLowestAsh(p);
                    return (
                      <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: isPurer ? 'var(--brand-forest-700)' : 'var(--text-main)' }}>
                            {p.ms.materiaMineralPct.toFixed(1)}% MS
                          </span>
                          {isPurer && (
                            <span
                              style={{
                                fontSize: '0.64rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--brand-forest-50)',
                                color: 'var(--brand-forest-700)',
                                border: '1px solid var(--brand-forest-200)',
                              }}
                            >
                              Menor Cinza
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Cálcio e Fósforo MS */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Cálcio / Fósforo e Relação Ca:P</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Ideal ABINPET: 1,1 a 1,6</span>
                  </td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                      <div>
                        Ca: {p.ms.calcioMinPct.toFixed(2)}% | P: {p.ms.fosforoMinPct.toFixed(2)}%
                      </div>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: p.relacaoCaP >= 1.0 && p.relacaoCaP <= 1.8 ? 'var(--brand-forest-700)' : 'var(--gold-700)',
                        }}
                      >
                        Relação Ca:P = {p.relacaoCaP}:1
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Energia Metabolizável */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Energia Metabolizável Estimada</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Equações preditivas NRC / ABINPET</span>
                  </td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                        ~{p.energiaMetabolizavel.emKcalKg} kcal/kg
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Carboidratos (ENN): {p.energiaMetabolizavel.ennPct}%
                      </div>
                    </td>
                  ))}
                </tr>

                {/* GRUPO 2: INGREDIENTES E ROTULAGEM */}
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-cream)' }}>
                  <td
                    colSpan={populatedProducts.length + 1}
                    style={{
                      padding: '10px 18px',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    2. Rotulagem Oficial, Conservantes e Ingredientes
                  </td>
                </tr>

                {/* Conservantes / Antioxidantes */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Antioxidantes / Conservantes</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Tocoferóis naturais vs BHT/BHA</span>
                  </td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                      {p.antioxidantType === 'NATURAL' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--brand-forest-50)',
                            color: 'var(--brand-forest-700)',
                            border: '1px solid var(--brand-forest-200)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          100% Naturais (Alecrim/Tocoferóis)
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                          }}
                        >
                          Sintéticos (BHT / BHA)
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Transgênicos (OGM) */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)' }}>
                    <div>Grãos Transgênicos (Decreto 4.680)</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Presença do símbolo oficial "T"</span>
                  </td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                      {p.containsGmo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TransgenicIcon size={18} />
                          <span style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700 }}>
                            Contém OGM (Símbolo T)
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--brand-forest-50)',
                            color: 'var(--brand-forest-700)',
                            border: '1px solid var(--brand-forest-200)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          100% Livre de Transgênicos
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Primeiros 5 Ingredientes */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-body)', wordBreak: 'break-word' }}>
                    <div>Primeiros 5 Ingredientes Declarados</div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Ordem decrescente oficial de quantidade</span>
                  </td>
                  {populatedProducts.map((p) => (
                    <td
                      key={p.id}
                      style={{
                        padding: '12px 18px',
                        borderLeft: '1px solid var(--border-cream)',
                        verticalAlign: 'top',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.80rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                        {p.topIngredientsList.slice(0, 5).map((ing, ingIdx) => (
                          <li
                            key={ingIdx}
                            style={{
                              fontWeight: ingIdx === 0 ? 700 : 400,
                              color: ingIdx === 0 ? 'var(--brand-forest-900)' : 'inherit',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              marginBottom: '4px',
                            }}
                          >
                            {ing}
                          </li>
                        ))}
                      </ol>
                    </td>
                  ))}
                </tr>

                {/* GRUPO 3: NÍVEIS DE GARANTIA EM MATÉRIA NATURAL (MN) */}
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-cream)' }}>
                  <td
                    colSpan={populatedProducts.length + 1}
                    style={{
                      padding: '10px 18px',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    3. Níveis Impressos no Rótulo da Embalagem (Matéria Natural - MN)
                  </td>
                </tr>

                {/* Umidade Máxima */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '10px 18px', color: 'var(--text-body)' }}>Umidade Máxima Declarada</td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '10px 18px', borderLeft: '1px solid var(--border-cream)', fontWeight: 600 }}>
                      {p.moistureMaxPct.toFixed(1)}% água
                    </td>
                  ))}
                </tr>

                {/* Proteína no Rótulo */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '10px 18px', color: 'var(--text-body)' }}>Proteína Bruta no Rótulo (MN)</td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '10px 18px', borderLeft: '1px solid var(--border-cream)', fontWeight: 600 }}>
                      {p.crudeProteinMinPct.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* Gordura no Rótulo */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '10px 18px', color: 'var(--text-body)' }}>Extrato Etéreo no Rótulo (MN)</td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '10px 18px', borderLeft: '1px solid var(--border-cream)', fontWeight: 600 }}>
                      {p.etherExtractMinPct.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* Matéria Mineral no Rótulo */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '10px 18px', color: 'var(--text-body)' }}>Matéria Mineral no Rótulo (MN)</td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '10px 18px', borderLeft: '1px solid var(--border-cream)', fontWeight: 600 }}>
                      {p.mineralMatterMaxPct.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* GRUPO 4: EVIDÊNCIA OFICIAL & CUSTÓDIA */}
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-cream)' }}>
                  <td
                    colSpan={populatedProducts.length + 1}
                    style={{
                      padding: '10px 18px',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    4. Custódia Documental e Transparência
                  </td>
                </tr>

                {/* Razão Social Fabricante */}
                <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                  <td style={{ padding: '10px 18px', color: 'var(--text-body)' }}>Fabricante / Razão Social</td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '10px 18px', borderLeft: '1px solid var(--border-cream)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {p.manufacturerLegalName || p.brand}
                    </td>
                  ))}
                </tr>

                {/* Evidência Digital */}
                <tr>
                  <td style={{ padding: '12px 18px', color: 'var(--text-body)' }}>Ficha Técnica Oficial</td>
                  {populatedProducts.map((p) => (
                    <td key={p.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-cream)' }}>
                      {p.sourceUrl ? (
                        <a
                          href={p.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--brand-forest-700)',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            textDecoration: 'underline',
                          }}
                        >
                          <span>Website do Fabricante</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Coleta documental</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Busca de Produtos */}
      <ProductSearchModal
        isOpen={activeModalSlot !== null}
        onClose={() => setActiveModalSlot(null)}
        onSelectProduct={(slug) => {
          if (activeModalSlot !== null) {
            handleSelectProduct(slug, activeModalSlot);
          }
        }}
        slotIndex={activeModalSlot ?? 0}
        selectedSlugs={selectedSlugs}
        initialSpeciesFilter={
          populatedProducts.length > 0
            ? (populatedProducts[0].species as any)
            : 'ALL'
        }
      />
    </div>
  );
}
