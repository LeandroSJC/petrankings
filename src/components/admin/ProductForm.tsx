'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  FileText,
  ExternalLink,
  Globe,
  Calendar,
  X,
  Store,
  Plus,
  Trash2,
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
  const frontImgInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ID persistente ou pré-alocado do produto para nomear arquivos e chave primária
  const [productId] = useState<string>(() => {
    if (initialProduct?.id) return initialProduct.id;
    return `pr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  });

  // Estado de lojas e links de compra
  const [affiliateLinks, setAffiliateLinks] = useState<{ id?: string; store: string; productUrl: string }[]>(() => {
    if (initialProduct?.affiliateLinks && Array.isArray(initialProduct.affiliateLinks)) {
      return initialProduct.affiliateLinks.map((al: any) => ({
        id: al.id,
        store: al.store || '',
        productUrl: al.productUrl || al.affiliateUrl || '',
      }));
    }
    return [];
  });

  const [storeSuggestions, setStoreSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then((data) => {
        if (data.stores && Array.isArray(data.stores)) {
          setStoreSuggestions(data.stores);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddStore = () => {
    setAffiliateLinks((prev) => [...prev, { store: '', productUrl: '' }]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveStore = (index: number) => {
    setAffiliateLinks((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleStoreChange = (index: number, field: 'store' | 'productUrl', value: string) => {
    setAffiliateLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setHasUnsavedChanges(true);
  };

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
      data.append('productId', productId);
      data.append('fileKind', isDoc ? 'ficha' : 'produto');

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

      const payload = {
        ...formData,
        id: productId,
        affiliateLinks: affiliateLinks
          .map((l) => ({ store: l.store.trim(), productUrl: l.productUrl.trim() }))
          .filter((l) => l.store && l.productUrl),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <legend style={{ padding: '0 8px', fontWeight: 800, color: 'var(--brand-forest-900)', fontSize: '1.1rem' }}>
              3. Custódia Digital e Fonte Oficial do Fabricante
            </legend>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Especificações técnicas e documentos arquivados comprovando as declarações do fabricante (Arts. 30 e 31 do CDC).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Linha 1: URL da Fonte Oficial + Data da Coleta */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  alignItems: 'start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    <Globe size={15} color="var(--brand-forest-700)" />
                    <span>URL Oficial da Página do Produto (Website do Fabricante) *</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.sourceUrl}
                    onChange={(e) => handleChange('sourceUrl', e.target.value)}
                    placeholder="https://www.marca.com.br/produtos/..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  />
                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Endereço público da ficha técnica no portal oficial da marca ou fabricante.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                    <Calendar size={15} color="var(--brand-forest-700)" />
                    <span>Data da Coleta Digital *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.labelCollectionDate}
                    onChange={(e) => handleChange('labelCollectionDate', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  />
                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Data do registro dos dados públicos oficiais.
                  </span>
                </div>
              </div>

              {/* Linha 2: Cards de Upload (Imagem e PDF) lado a lado em cards dedicados */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Card A: Imagem / Packshot */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-cream-main)',
                    border: '1.5px solid var(--border-cream)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
                      <Camera size={15} color="var(--brand-forest-700)" />
                      <span>Packshot Oficial (Imagem do Produto)</span>
                    </label>
                    {formData.frontLabelImageUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange('frontLabelImageUrl', '')}
                        style={{
                          fontSize: '0.72rem',
                          color: '#b91c1c',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                        }}
                      >
                        <X size={12} /> Limpar
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formData.frontLabelImageUrl}
                      onChange={(e) => handleChange('frontLabelImageUrl', e.target.value)}
                      placeholder="URL da imagem ou clique em Subir..."
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '9px 12px',
                        borderRadius: '4px',
                        border: '1.5px solid var(--border-cream)',
                        backgroundColor: '#ffffff',
                        fontSize: '0.84rem',
                      }}
                    />
                    <input
                      ref={frontImgInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/jpg,.jpg,.jpeg,.png,.webp,.avif"
                      disabled={uploadingImg}
                      onChange={(e) => handleFileUpload(e, 'frontLabelImageUrl')}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={uploadingImg}
                      onClick={() => frontImgInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-cream)',
                        fontSize: '0.80rem',
                        fontWeight: 700,
                        color: 'var(--brand-forest-900)',
                        cursor: uploadingImg ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: 'var(--shadow-xs)',
                        flexShrink: 0,
                      }}
                    >
                      {uploadingImg ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <span>{uploadingImg ? 'Enviando...' : 'Subir Imagem'}</span>
                    </button>
                  </div>

                  {formData.frontLabelImageUrl ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 10px',
                        backgroundColor: '#ffffff',
                        borderRadius: '4px',
                        border: '1px solid var(--border-cream)',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-cream)',
                          overflow: 'hidden',
                          backgroundColor: 'var(--bg-cream-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={formData.frontLabelImageUrl}
                          alt="Packshot Preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-forest-800)' }}>
                          ✓ Imagem vinculada com sucesso
                        </span>
                        <span style={{ display: 'block', fontSize: '0.70rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formData.frontLabelImageUrl}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      Formatos aceitos: JPG, PNG, WebP ou AVIF oficial do fabricante (máx. 15MB).
                    </span>
                  )}
                </div>

                {/* Card B: Ficha Técnica PDF */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-cream-main)',
                    border: '1.5px solid var(--border-cream)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
                      <FileText size={15} color="var(--brand-forest-700)" />
                      <span>Comprovante da Ficha Técnica (PDF) *</span>
                    </label>
                    {formData.sourceDocumentUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange('sourceDocumentUrl', '')}
                        style={{
                          fontSize: '0.72rem',
                          color: '#b91c1c',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                        }}
                      >
                        <X size={12} /> Limpar
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formData.sourceDocumentUrl}
                      onChange={(e) => handleChange('sourceDocumentUrl', e.target.value)}
                      placeholder="URL do PDF ou clique em Subir..."
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '9px 12px',
                        borderRadius: '4px',
                        border: '1.5px solid var(--border-cream)',
                        backgroundColor: '#ffffff',
                        fontSize: '0.84rem',
                      }}
                    />
                    <input
                      ref={docInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={uploadingDoc}
                      onChange={(e) => handleFileUpload(e, 'sourceDocumentUrl')}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={uploadingDoc}
                      onClick={() => docInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-cream)',
                        fontSize: '0.80rem',
                        fontWeight: 700,
                        color: 'var(--brand-forest-900)',
                        cursor: uploadingDoc ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: 'var(--shadow-xs)',
                        flexShrink: 0,
                      }}
                    >
                      {uploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                      <span>{uploadingDoc ? 'Enviando...' : 'Subir PDF'}</span>
                    </button>
                  </div>

                  {formData.sourceDocumentUrl ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        backgroundColor: '#ffffff',
                        borderRadius: '4px',
                        border: '1px solid var(--border-cream)',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '4px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid #fecaca',
                        }}
                      >
                        <FileText size={22} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-forest-800)' }}>
                          ✓ PDF anexado e auditável
                        </span>
                        <a
                          href={formData.sourceDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--brand-forest-700)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'underline',
                          }}
                        >
                          <span>Abrir arquivo em nova aba</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <span style={{ display: 'block', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      Documento PDF oficial arquivado no servidor para custódia perene.
                    </span>
                  )}
                </div>
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
                  Composição Básica Completa / Ingredientes em Ordem Decrescente *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.topIngredients}
                  onChange={(e) => handleChange('topIngredients', e.target.value)}
                  placeholder="Copie e cole a lista de ingredientes do site oficial ou do rótulo físico (separados por vírgula)..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)', fontFamily: 'inherit' }}
                />
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Você pode colar a lista integral de ingredientes exatamente como declarada pelo fabricante (incluindo matérias-primas e aditivos). O algoritmo analisa a ordem decrescente oficial para classificar a qualidade proteica e carboidratos nobres (Pilar 3).
                </span>
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

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    Parecer Editorial / Opinião Descritiva (Exibido no Topo da Página do Produto)
                  </label>
                  {liveAudit.parecerSugerido && (
                    <button
                      type="button"
                      onClick={() => handleChange('editorialOpinion', liveAudit.parecerSugerido)}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--brand-forest-700)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Preencher com sugestão automática do algoritmo
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={formData.editorialOpinion}
                  onChange={(e) => handleChange('editorialOpinion', e.target.value)}
                  placeholder={liveAudit.parecerSugerido || 'Parecer descritivo e transparente sobre a formulação do alimento...'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1.5px solid var(--border-cream)', fontFamily: 'inherit' }}
                />
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Este texto é exibido em destaque logo abaixo do título, marca e fabricante na página do produto. Se deixado em branco, o sistema utilizará o parecer gerado automaticamente pelo algoritmo com base na nota.
                </span>
              </div>
            </div>
          </fieldset>

          {/* 6. ONDE COMPRAR / LOJAS VINCULADAS */}
          <fieldset
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <legend
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 8px',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                fontSize: '1.1rem',
              }}
            >
              <Store size={18} color="var(--brand-forest-700)" />
              6. Onde Comprar / Lojas Vinculadas
            </legend>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Cadastre os grandes varejistas ou lojas parceiras onde este produto é vendido e o link direto da oferta. O nome do varejista é livre: você pode digitar qualquer nome ou escolher uma das sugestões automáticas baseadas nas lojas já cadastradas.
            </p>

            <datalist id="store-suggestions-list">
              {storeSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            {affiliateLinks.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-cream-main)',
                  border: '1.5px dashed var(--border-cream)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                  Nenhuma loja vinculada a este produto até o momento.
                </p>
                <button
                  type="button"
                  onClick={handleAddStore}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--brand-forest-900)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  Adicionar Primeira Loja
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {affiliateLinks.map((linkItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 240px) 1fr auto',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-cream-main)',
                      border: '1px solid var(--border-cream)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Nome da Loja / Varejista
                      </label>
                      <input
                        type="text"
                        list="store-suggestions-list"
                        placeholder="Ex: Nome do varejista ou loja..."
                        value={linkItem.store}
                        onChange={(e) => handleStoreChange(idx, 'store', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '4px',
                          border: '1.5px solid var(--border-cream)',
                          fontSize: '0.85rem',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Link da Oferta / Página do Produto
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={linkItem.productUrl}
                        onChange={(e) => handleStoreChange(idx, 'productUrl', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '4px',
                          border: '1.5px solid var(--border-cream)',
                          fontSize: '0.85rem',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{ paddingTop: '18px' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveStore(idx)}
                        title="Remover loja"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 10px',
                          backgroundColor: '#fef2f2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleAddStore}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: 'var(--brand-forest-900)',
                      border: '1.5px dashed var(--brand-forest-700)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} />
                    Adicionar Outra Loja
                  </button>
                </div>
              </div>
            )}
          </fieldset>
        </div>
      </div>
    </form>
  );
}
