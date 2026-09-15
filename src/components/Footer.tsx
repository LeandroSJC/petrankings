import React from 'react';
import Link from 'next/link';
import { PawPrint, ShieldAlert, FileText, Building2, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#090d16',
        color: '#f8fafc',
        borderTop: '1px solid #1e293b',
        marginTop: 'auto',
        paddingTop: '50px',
        paddingBottom: '36px',
      }}
    >
      <div className="container">
        {/* Bloco de Navegação e Apresentação */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          {/* Coluna 1: Sobre o Projeto */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-forest-700)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                <PawPrint size={20} aria-hidden="true" fill="currentColor" strokeWidth={1.5} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                Pet<span style={{ color: 'var(--brand-forest-400)' }}>Rankings</span>
              </span>
            </div>
            <p style={{ fontSize: '0.90rem', color: '#94a3b8', lineHeight: 1.65, marginBottom: '16px' }}>
              Guia independente e avaliação nutricional de rações para cães e gatos. Classificação técnica baseada no Manual ABINPET (11ª Edição) e normas do MAPA.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--brand-forest-400)' }}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>Algoritmo 100% determinístico e sem juízo subjetivo</span>
            </div>
          </div>

          {/* Coluna 2: Índices e Segmentações */}
          <nav aria-label="Navegação por categorias">
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.05rem',
                color: '#ffffff',
                marginBottom: '16px',
                letterSpacing: '-0.2px',
              }}
            >
              Índices Segmentados
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
              <li>
                <Link href="/indice/caes-adultos" className="footer-link">
                  🐶 Cães Adultos — Alimentos Secos
                </Link>
              </li>
              <li>
                <Link href="/indice/caes-filhotes" className="footer-link">
                  🐶 Cães Filhotes — Alimentos Secos
                </Link>
              </li>
              <li>
                <Link href="/indice/gatos-adultos" className="footer-link">
                  🐱 Gatos Adultos — Alimentos Secos
                </Link>
              </li>
              <li>
                <Link href="/indice/gatos-filhotes" className="footer-link">
                  🐱 Gatos Filhotes — Alimentos Secos
                </Link>
              </li>
              <li>
                <Link href="/coadjuvantes" className="footer-link" style={{ color: '#a5b4fc', fontWeight: 600 }}>
                  🏥 Catálogo de Alimentos Coadjuvantes
                </Link>
              </li>
            </ul>
          </nav>

          {/* Coluna 3: Relações Institucionais & Fabricantes */}
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.05rem',
                color: '#ffffff',
                marginBottom: '16px',
                letterSpacing: '-0.2px',
              }}
            >
              Governança & Fabricantes
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem', marginBottom: '18px' }}>
              <li>
                <Link href="/sobre" className="footer-link">
                  <FileText size={16} aria-hidden="true" style={{ color: 'var(--brand-forest-400)', flexShrink: 0 }} />
                  <span>Metodologia e Pilares do Índice</span>
                </Link>
              </li>
              <li>
                <Link href="/contato" className="footer-link">
                  <MessageSquare size={16} aria-hidden="true" style={{ color: 'var(--brand-forest-400)', flexShrink: 0 }} />
                  <span>Canal do Consumidor / Fale Conosco</span>
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidade" className="footer-link">
                  <ShieldCheck size={16} aria-hidden="true" style={{ color: 'var(--brand-forest-400)', flexShrink: 0 }} />
                  <span>Política de Privacidade & Termos</span>
                </Link>
              </li>
            </ul>

            {/* Botão de Destaque para Fabricantes */}
            <Link
              href="/fabricante"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                border: '1px solid var(--brand-forest-500)',
                color: 'var(--brand-forest-300)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'var(--transition-fast)',
              }}
              className="fabricante-btn-hover"
            >
              <Building2 size={16} />
              <span>Fabricante: Solicite Atualização de Dados Oficiais</span>
            </Link>
          </div>
        </div>

        {/* Disclaimer Jurídico Obrigatório na Íntegra */}
        <div className="disclaimer-legal-box" style={{ marginBottom: '32px', backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <ShieldAlert size={20} color="var(--brand-forest-400)" aria-hidden="true" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#f8fafc' }}>
              Termo de Transparência, Metodologia e Isenção de Responsabilidade
            </span>
          </div>
          <p style={{ marginBottom: '10px', color: '#94a3b8' }}>
            O presente portal tem caráter estritamente educativo, consultivo e informativo, visando à promoção da transparência e do direito do consumidor à informação clara e precisa, nos termos do <strong style={{ color: '#e2e8f0' }}>Artigo 6º, Inciso III, e Artigo 31 da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor)</strong>. As pontuações, semáforos visuais e índices de conformidade apresentados decorrem de análise comparativa documental baseada exclusivamente nas informações declaradas e publicadas pelos próprios fabricantes nos websites oficiais de suas marcas, confrontadas com as diretrizes do <strong style={{ color: '#e2e8f0' }}>Manual Pet Food Brasil (ABINPET, 11ª Edição)</strong>.
          </p>
          <p style={{ color: '#94a3b8' }}>
            Este portal não realiza análises laboratoriais bromatológicas próprias nem emite juízos sobre a eficácia biológica in vivo dos produtos. Alimentos coadjuvantes (prescrição veterinária) são avaliados segundo seus objetivos clínicos específicos e não concorrem em listagens de alimentos de manutenção regular. O conteúdo não substitui a avaliação individual de um médico veterinário ou zootecnista. Fabricantes podem solicitar atualização de dados a qualquer momento por meio de nosso canal institucional.
          </p>
        </div>

        {/* Linha inferior de copyright */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '24px',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: '#94a3b8',
          }}
        >
          <span>© {new Date().getFullYear()} PetRankings — Guia e Avaliação Nutricional de Pet Food. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
