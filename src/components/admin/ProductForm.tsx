'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  PawPrint,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Loader2,
  Eye,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { calcularScoreAnaliseRotulo } from '@/lib/audit-engine';

interface ProductFormProps {
  initialProduct?: any;
  isEdit?: boolean;
}

export default function ProductForm({ initialProduct, isEdit }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    commercialName: initialProduct?.commercialName || '',
    brand: initialProduct?.brand || '',
    manufacturerLegalName: initialProduct?.manufacturerLegalName || '',
    slug: initialProduct?.slug || '',
    legalCategory: initialProduct?.legalCategory || 'ALIMENTO_COMPLETO',
    species: initialProduct?.species || 'CAO',
    lifeStage: initialProduct?.lifeStage || 'ADULTO',
    breedSize: initialProduct?.breedSize || 'TODOS',
    foodType: initialProduct?.foodType || 'SECO',
    coadjuvanteCondition: initialProduct?.coadjuvanteCondition || '',
    sourceUrl: initialProduct?.sourceUrl || '',
    sourceArchiveUrl: initialProduct?.sourceArchiveUrl || '',
    sourceDocumentUrl: initialProduct?.sourceDocumentUrl || '',
    analyzedBatch: initialProduct?.analyzedBatch || '',
    labelCollectionDate: initialProduct?.labelCollectionDate
      ? new Date(initialProduct.labelCollectionDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    frontLabelImageUrl: initialProduct?.frontLabelImageUrl || '',
    backLabelImageUrl: initialProduct?.backLabelImageUrl || '',

    moistureMaxPct: initialProduct?.moistureMaxPct ?? 10.0,
    crudeProteinMinPct: initialProduct?.crudeProteinMinPct ?? 26.0,
    etherExtractMinPct: initialProduct?.etherExtractMinPct ?? 14.0,
    crudeFiberMaxPct: initialProduct?.crudeFiberMaxPct ?? 3.0,
    mineralMatterMaxPct: initialProduct?.mineralMatterMaxPct ?? 7.5,
    calciumMinPct: initialProduct?.calciumMinPct ?? 1.1,
    calciumMaxPct: initialProduct?.calciumMaxPct ?? 1.6,
    phosphorusMinPct: initialProduct?.phosphorusMinPct ?? 0.85,
    sodiumMinPct: initialProduct?.sodiumMinPct ?? 0.22,
    omega3MinPct: initialProduct?.omega3MinPct ?? 0.35,

    topIngredients: (() => {
      if (!initialProduct?.topIngredients) return '';
      try {
        const parsed = JSON.parse(initialProduct.topIngredients);
        return Array.isArray(parsed) ? parsed.join(', ') : initialProduct.topIngredients;
      } catch {
        return initialProduct.topIngredients;
      }
    })(),
    antioxidantType: initialProduct?.antioxidantType || 'NATURAL',
    containsGmo: initialProduct?.containsGmo ?? true,
    gmoIngredients: initialProduct?.gmoIngredients || 'Milho transgênico (Bt), Soja transgênica (RR)',
    meatClaimType: initialProduct?.meatClaimType || 'COM_CARNE',
    editorialOpinion: initialProduct?.editorialOpinion || '',
    isPublished: initialProduct?.isPublished ?? true,
  });

  // Guardião beforeunload contra perda de dados acidental
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'sourceDocumentUrl' | 'frontLabelImageUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isDoc = targetField === 'sourceDocumentUrl';
    if (isDoc) setUploadingDoc(true);
    else setUploadingImg(true);

    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao processar upload do arquivo');
      }

      handleChange(targetField, json.url);
      showToast('Arquivo enviado e vinculado com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Falha no upload', 'error');
    } finally {
      if (isDoc) setUploadingDoc(false);
      else setUploadingImg(false);
      e.target.value = '';
    }
  };

  // Cálculo do Score em Tempo Real
  const liveAudit = useMemo(() => {
    const parsedIng = formData.topIngredients
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    return calcularScoreAnaliseRotulo(
      formData.species as any,
      formData.lifeStage as any,
      {
        umidadeMaxPct: parseFloat(formData.moistureMaxPct) || 10,
        proteinaBrutaMinPct: parseFloat(formData.crudeProteinMinPct) || 0,
        extratoEtereoMinPct: parseFloat(formData.etherExtractMinPct) || 0,
        materiaFibrosaMaxPct: parseFloat(formData.crudeFiberMaxPct) || 0,
        materiaMineralMaxPct: parseFloat(formData.mineralMatterMaxPct) || 0,
        calcioMinPct: parseFloat(formData.calciumMinPct) || 0,
        calcioMaxPct: formData.calciumMaxPct ? parseFloat(formData.calciumMaxPct) : null,
        fosforoMinPct: parseFloat(formData.phosphorusMinPct) || 0,
        sodioMinPct: formData.sodiumMinPct ? parseFloat(formData.sodiumMinPct) : null,
        omega3MinPct: formData.omega3MinPct ? parseFloat(formData.omega3MinPct) : null,
      },
      {
        topIngredientes: parsedIng,
        antioxidanteTipo: formData.antioxidantType as any,
        omega3OuPrebioticosGarantidos: (parseFloat(formData.omega3MinPct) || 0) >= 0.2,
        claimCarneTipo: formData.meatClaimType as any,
        claimCarneAdequado: true,
      }
    );
  }, [
    formData.species,
    formData.lifeStage,
    formData.moistureMaxPct,
    formData.crudeProteinMinPct,
    formData.etherExtractMinPct,
    formData.crudeFiberMaxPct,
    formData.mineralMatterMaxPct,
    formData.calciumMinPct,
    formData.calciumMaxPct,
    formData.phosphorusMinPct,
    formData.sodiumMinPct,
    formData.omega3MinPct,
    formData.topIngredients,
    formData.antioxidantType,
    formData.meatClaimType,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const endpoint = isEdit ? `/api/products/${initialProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar produto.');
      }

      setHasUnsavedChanges(false);
      showToast(isEdit ? 'Produto atualizado com sucesso!' : 'Produto cadastrado e analisado com sucesso!', 'success');
      router.push('/admin/produtos');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar produto.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isCoadjuvante = formData.legalCategory === 'ALIMENTO_COADJUVANTE';

  return (
    <form onSubmit={handleSubmit} style={{ paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        {/* Header do Formulário */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            margin: '28px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/admin/produtos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-cream-subtle)',
                color: 'var(--brand-forest-900)',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </Link>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', color: 'var(--brand-forest-900)' }}>
              {isEdit ? `Editar Produto: ${initialProduct.commercialName}` : 'Nova Análise de Rótulo de Pet Food'}
            </h1>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand-forest-900)',
              color: '#ffffff',
              fontSize: '0.90rem',
              fontWeight: 800,
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isEdit ? 'Salvar Alterações' : 'Salvar e Gerar Laudo'}</span>
          </button>
        </div>

        {/* Banner de Pré-visualização do Score em Tempo Real */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--gold-400)',
            padding: '20px 24px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: isCoadjuvante ? '#eef2ff' : liveAudit.scoreTotal >= 75 ? '#ecfdf5' : '#fffbeb',
                color: isCoadjuvante ? '#4338ca' : liveAudit.scoreTotal >= 75 ? '#065f46' : '#92400e',
                border: '3px solid currentColor',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{isCoadjuvante ? 'CLIN' : liveAudit.scoreTotal}</span>
              <span style={{ fontSize: '0.55rem', textTransform: 'uppercase' }}>pontos</span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Cálculo em Tempo Real (Motor Determinístico)
              </span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                {isCoadjuvante ? 'Alimento Coadjuvante (Sem Score Comparativo)' : liveAudit.faixaNomeFormatado}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Relação Ca:P: <strong>{liveAudit.relacaoCaP}:1</strong> • Proteína MS: <strong>{liveAudit.nutrientesMS.proteinaBrutaPct}%</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem' }}>
            {liveAudit.extratoPontos.map((p, i) => (
              <div key={i} style={{ backgroundColor: 'var(--bg-cream-main)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-cream-light)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>{p.pilar}</span>
                <strong style={{ color: 'var(--brand-forest-900)' }}>{p.pontos_obtidos}/{p.pontos_max} pts</strong>
              </div>
            ))}
          </div>
        </div>

        {/* SESSÕES DO FORMULÁRIO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* 1. Dados Cadastrais & Fabricante */}
          <fieldset
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <legend style={{ padding: '0 8px', fontWeight: 800, color: 'var(--brand-forest-900)', fontSize: '1.1rem' }}>
              1. Identificação Comercial e Fabricante
            </legend>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '12px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Nome Comercial Completo (Exatamente como no rótulo) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.commercialName}
                  onChange={(e) => handleChange('commercialName', e.target.value)}
                  placeholder="Ex: Ração Super Premium Cães Adultos Frango e Arroz"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Marca *</label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="Ex: PremieR Pet, Royal Canin..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Fabricante / Empresa</label>
                <input
                  type="text"
                  value={formData.manufacturerLegalName}
                  onChange={(e) => handleChange('manufacturerLegalName', e.target.value)}
                  placeholder="Ex: Grandfood / PremieR Pet"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>
            </div>
          </fieldset>

          {/* 2. Taxonomia & Classificação Legal */}
          <fieldset
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <legend style={{ padding: '0 8px', fontWeight: 800, color: 'var(--brand-forest-900)', fontSize: '1.1rem' }}>
              2. Classificação Regulatória e Espécie
            </legend>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Categoria Legal *</label>
                <select
                  value={formData.legalCategory}
                  onChange={(e) => handleChange('legalCategory', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                >
                  <option value="ALIMENTO_COMPLETO">Alimento Completo (Manutenção)</option>
                  <option value="ALIMENTO_COADJUVANTE">Alimento Coadjuvante (Prescrição Clínica)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Espécie *</label>
                <select
                  value={formData.species}
                  onChange={(e) => handleChange('species', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                >
                  <option value="CAO">🐶 Cão</option>
                  <option value="GATO">🐱 Gato</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Fase da Vida *</label>
                <select
                  value={formData.lifeStage}
                  onChange={(e) => handleChange('lifeStage', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                >
                  <option value="ADULTO">Adulto</option>
                  <option value="CRESCIMENTO_INICIAL">Filhote / Crescimento</option>
                  <option value="SENIOR">Sênior / Idoso</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Porte Recomendado</label>
                <select
                  value={formData.breedSize}
                  onChange={(e) => handleChange('breedSize', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                >
                  <option value="TODOS">Todos os Portes</option>
                  <option value="MINI_PEQUENO">Mini e Pequeno</option>
                  <option value="MEDIO_GRANDE">Médio e Grande</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Tipo / Formato de Alimento *</label>
                <select
                  value={formData.foodType}
                  onChange={(e) => {
                    const novoTipo = e.target.value;
                    handleChange('foodType', novoTipo);
                    if (novoTipo === 'UMIDO' && Number(formData.moistureMaxPct) <= 15) {
                      handleChange('moistureMaxPct', 82.0);
                    } else if (novoTipo === 'SECO' && Number(formData.moistureMaxPct) > 20) {
                      handleChange('moistureMaxPct', 10.0);
                    }
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                >
                  <option value="SECO">🥣 Alimento Seco (Ração / Croquete)</option>
                  <option value="UMIDO">🥫 Alimento Úmido (Sachê / Patê / Lata)</option>
                  <option value="SEMI_UMIDO">🍖 Alimento Semiúmido</option>
                </select>
              </div>

              {isCoadjuvante && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#4338ca' }}>
                    Patologia / Indicação Clínica *
                  </label>
                  <select
                    value={formData.coadjuvanteCondition}
                    onChange={(e) => handleChange('coadjuvanteCondition', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid #818cf8', backgroundColor: '#eef2ff' }}
                  >
                    <option value="">Selecione...</option>
                    <option value="RENAL">Renal</option>
                    <option value="URINARIO">Urinário</option>
                    <option value="OBESIDADE">Obesidade / Controle de Peso</option>
                    <option value="HEPATICO">Hepático</option>
                    <option value="HIPOALERGENICO">Hipoalergênico / Dermatológico</option>
                    <option value="GASTROINTESTINAL">Gastrointestinal</option>
                    <option value="OUTRO">Outro Suporte Específico</option>
                  </select>
                </div>
              )}
            </div>
          </fieldset>

          {/* 3. Custódia Digital e Fonte Oficial do Fabricante */}
          <fieldset
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid #cbd5e1',
              padding: '24px',
            }}
          >
            <legend style={{ padding: '0 8px', fontWeight: 800, color: 'var(--brand-forest-900)', fontSize: '1.1rem' }}>
              3. Custódia Digital e Fonte Oficial do Fabricante
            </legend>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Especificações técnicas oficiais extraídas diretamente do website do fabricante com respaldo nos Arts. 30 e 31 do CDC.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  URL Oficial da Página do Produto (Website do Fabricante) *
                </label>
                <input
                  type="url"
                  required
                  value={formData.sourceUrl}
                  onChange={(e) => handleChange('sourceUrl', e.target.value)}
                  placeholder="https://www.marca.com.br/produtos/..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  URL do Snapshot no Wayback Machine (web.archive.org)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    value={formData.sourceArchiveUrl}
                    onChange={(e) => handleChange('sourceArchiveUrl', e.target.value)}
                    placeholder="https://web.archive.org/web/..."
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  />
                  {formData.sourceUrl && (
                    <a
                      href={`https://web.archive.org/save/${formData.sourceUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="editorial-btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '0 10px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}
                      title="Abrir Wayback Machine para arquivar a URL"
                    >
                      Salvar Snapshot ↗
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Data da Coleta Digital dos Dados *
                </label>
                <input
                  type="date"
                  required
                  value={formData.labelCollectionDate}
                  onChange={(e) => handleChange('labelCollectionDate', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  URL da Imagem Oficial do Produto (Packshot da Marca)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={formData.frontLabelImageUrl}
                    onChange={(e) => handleChange('frontLabelImageUrl', e.target.value)}
                    placeholder="https://...imagem-produto.png"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  />
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-cream-main)',
                      border: '1.5px solid var(--border-cream)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--brand-forest-900)',
                      cursor: uploadingImg ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {uploadingImg ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                    <span>{uploadingImg ? 'Enviando...' : 'Subir Imagem'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={uploadingImg}
                      onChange={(e) => handleFileUpload(e, 'frontLabelImageUrl')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  URL do Comprovante da Ficha Técnica (Print ou PDF)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={formData.sourceDocumentUrl}
                    onChange={(e) => handleChange('sourceDocumentUrl', e.target.value)}
                    placeholder="https://...comprovante-ficha.pdf"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  />
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-cream-main)',
                      border: '1.5px solid var(--border-cream)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--brand-forest-900)',
                      cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {uploadingDoc ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                    <span>{uploadingDoc ? 'Enviando...' : 'Subir PDF / Print'}</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      disabled={uploadingDoc}
                      onChange={(e) => handleFileUpload(e, 'sourceDocumentUrl')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Cole o link público ou clique em <strong>Subir PDF / Print</strong> para enviar o arquivo diretamente do seu computador.
                </span>
              </div>
            </div>
          </fieldset>

          {/* 4. Níveis de Garantia Declarados (Matéria Natural - MN) */}
          <fieldset
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <legend style={{ padding: '0 8px', fontWeight: 800, color: 'var(--brand-forest-900)', fontSize: '1.1rem' }}>
              4. Níveis de Garantia Declarados no Rótulo (Matéria Natural - MN)
            </legend>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Umidade Máx % *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.moistureMaxPct}
                  onChange={(e) => handleChange('moistureMaxPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Proteína Bruta Mín % *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.crudeProteinMinPct}
                  onChange={(e) => handleChange('crudeProteinMinPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Extrato Etéreo Mín % *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.etherExtractMinPct}
                  onChange={(e) => handleChange('etherExtractMinPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Matéria Fibrosa Máx % *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.crudeFiberMaxPct}
                  onChange={(e) => handleChange('crudeFiberMaxPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Matéria Mineral Máx % *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.mineralMatterMaxPct}
                  onChange={(e) => handleChange('mineralMatterMaxPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Cálcio Mín % *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.calciumMinPct}
                  onChange={(e) => handleChange('calciumMinPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Cálcio Máx %</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.calciumMaxPct || ''}
                  onChange={(e) => handleChange('calciumMaxPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Fósforo Mín % *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.phosphorusMinPct}
                  onChange={(e) => handleChange('phosphorusMinPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Sódio Mín %</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sodiumMinPct || ''}
                  onChange={(e) => handleChange('sodiumMinPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '4px' }}>Ômega-3 Mín %</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.omega3MinPct || ''}
                  onChange={(e) => handleChange('omega3MinPct', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                />
              </div>
            </div>
          </fieldset>

          {/* 5. Ingredientes & Rotulagem */}
          <fieldset
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <legend style={{ padding: '0 8px', fontWeight: 800, color: 'var(--brand-forest-900)', fontSize: '1.1rem' }}>
              5. Ingredientes e Análise de Aditivos
            </legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  Principais Ingredientes em Ordem Decrescente (Separados por vírgula) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.topIngredients}
                  onChange={(e) => handleChange('topIngredients', e.target.value)}
                  placeholder="Ex: Farinha de vísceras de frango, Quirera de arroz, Gordura de aves, Óleo de salmão..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Tipo de Antioxidante *</label>
                  <select
                    value={formData.antioxidantType}
                    onChange={(e) => handleChange('antioxidantType', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  >
                    <option value="NATURAL">Exclusivamente Natural (Tocoferóis/Alecrim)</option>
                    <option value="SINTETICO">Sintético (Contém BHA, BHT ou Etoxiquina)</option>
                    <option value="MISTO">Misto</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Claim Comercial de Carne</label>
                  <select
                    value={formData.meatClaimType}
                    onChange={(e) => handleChange('meatClaimType', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  >
                    <option value="COM_CARNE">"Com Carne" (Adere aos requisitos)</option>
                    <option value="SABOR_CARNE">"Sabor Carne" (Apenas aromatizante)</option>
                    <option value="NENHUM">Sem claim cárneo no painel principal</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.containsGmo}
                      onChange={(e) => handleChange('containsGmo', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-forest-800)' }}
                    />
                    <span>Contém Transgênico (OGM)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => handleChange('isPublished', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-forest-800)' }}
                    />
                    <span>Publicado no Site Público</span>
                  </label>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </form>
  );
}
