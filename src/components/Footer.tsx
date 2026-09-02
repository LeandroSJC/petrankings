import React from 'react';
import Link from 'next/link';
import { Award, Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--brand-forest-950)',
        color: '#f8fafc',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: 'auto',
        paddingTop: '60px',
        paddingBottom: '40px',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 60%)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '44px',
            marginBottom: '48px',
          }}
        >
          {/* Coluna 1: Sobre o Projeto */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #082115 0%, #174e35 100%)',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  border: '1.5px solid rgba(212, 175, 55, 0.4)',
                }}
              >
                <Award size={22} aria-hidden="true" />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#ffffff',
                }}
              >
                Pet<span style={{ color: 'var(--gold-400)' }}>Rankings</span>
              </span>
            </div>
            <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.7 }}>
              Guia comparador independente de produtos para cães e gatos. Consolidamos avaliações e notas de compradores reais nas principais lojas do Brasil para ajudar você a escolher o melhor produto e economizar tempo.
            </p>
          </div>

          {/* Coluna 2: Navegação */}
          <nav aria-label="Navegação do rodapé">
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                color: '#ffffff',
                marginBottom: '20px',
                letterSpacing: '-0.2px',
              }}
            >
              Navegação
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.94rem' }}>
              <li>
                <Link href="/" className="footer-link">
                  Início & Todos os Rankings
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="footer-link">
                  Sobre o PetRankings
                </Link>
              </li>
              <li>
                <Link href="/sobre#como-calculamos" className="footer-link">
                  Metodologia de Avaliação
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="footer-link">
                  Perguntas Frequentes (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/contato" className="footer-link">
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidade" className="footer-link">
                  Política de Privacidade e Cookies
                </Link>
              </li>
            </ul>
          </nav>

          {/* Coluna 3: Transparência & Saúde Pet */}
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                color: '#ffffff',
                marginBottom: '20px',
                letterSpacing: '-0.2px',
              }}
            >
              Aviso Editorial
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '14px' }}>
              O PetRankings é um serviço de comparação de consumo e não substitui consultas, diagnósticos ou prescrições veterinárias. Consulte sempre o médico veterinário do seu pet.
            </p>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} color="var(--gold-400)" aria-hidden="true" />
              <span>Notas calculadas a partir de avaliações reais de e-commerce.</span>
            </div>
          </div>
        </div>

        {/* Linha inferior de copyright e carinho */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.85rem',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>© {new Date().getFullYear()} PetRankings. Todos os direitos reservados.</span>
            <span aria-hidden="true">•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Criado com <Heart size={13} fill="#ef4444" color="#ef4444" aria-hidden="true" /> para tutores de cães e gatos.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
