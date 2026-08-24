import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Cookie, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade e Cookies | PetRankings',
  description: 'Conheça nossa política de privacidade, uso de cookies e conformidade com a LGPD e GDPR no portal PetRankings.',
};

export default function PoliticaPrivacidadePage() {
  return (
    <div style={{ padding: '40px 0 80px 0', backgroundColor: 'var(--bg-cream-main)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Voltar */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--brand-forest-800)',
            marginBottom: '24px',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>Voltar para a página inicial</span>
        </Link>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--brand-forest-50)',
              color: 'var(--brand-forest-800)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 800,
              marginBottom: '12px',
              border: '1px solid var(--brand-forest-200)',
            }}
          >
            <Shield size={14} color="var(--brand-forest-700)" />
            <span>Transparência e Proteção de Dados</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
            Política de Privacidade e Uso de Cookies
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </p>
        </div>

        {/* Conteúdo Principal */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-cream)',
            padding: 'clamp(24px, 5vw, 44px)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            fontSize: '1rem',
            color: 'var(--text-body)',
            lineHeight: 1.75,
          }}
        >
          {/* Seção 1: Apresentação */}
          <section>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--brand-forest-900)', marginBottom: '12px' }}>
              1. Visão Geral e Compromisso com sua Privacidade
            </h2>
            <p>
              O <strong>PetRankings</strong> (acessível em <a href="https://petrankings.com.br" style={{ color: 'var(--brand-forest-800)', fontWeight: 600 }}>https://petrankings.com.br</a>) tem o compromisso de proteger a privacidade e os dados pessoais de todos os tutores e visitantes que utilizam nossa plataforma editorial de comparação de produtos para cães e gatos.
            </p>
            <p style={{ marginTop: '10px' }}>
              Esta Política de Privacidade está em total conformidade com a <strong>LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709/2018)</strong> no Brasil e com o <strong>GDPR (Regulamento Geral sobre a Proteção de Dados)</strong> da União Europeia.
            </p>
          </section>

          {/* Seção 2: Dados Coletados */}
          <section>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--brand-forest-900)', marginBottom: '12px' }}>
              2. Quais Dados Coletamos
            </h2>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Dados fornecidos voluntariamente:</strong> Nome e endereço de e-mail ao preencher nosso formulário de contato para dúvidas, sugestões ou correções editoriais.
              </li>
              <li>
                <strong>Dados de navegação e métricas anônimas:</strong> Endereço IP anonimizado, tipo de navegador, páginas visualizadas e tempo de permanência, coletados para aprimoramento da usabilidade e estabilidade técnica do portal.
              </li>
            </ul>
          </section>

          {/* Seção 3: Cookies e Publicidade Google AdSense */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Cookie size={22} color="var(--brand-forest-700)" />
              <h2 style={{ fontSize: '1.35rem', color: 'var(--brand-forest-900)' }}>
                3. Uso de Cookies e Google AdSense
              </h2>
            </div>
            <p>
              Utilizamos cookies para personalizar conteúdos e anúncios, fornecer recursos de mídia social e analisar o tráfego do site.
            </p>
            <div style={{ backgroundColor: 'var(--bg-cream-subtle)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-cream)', margin: '14px 0' }}>
              <strong style={{ color: 'var(--brand-forest-900)', display: 'block', marginBottom: '6px' }}>
                Programa Google AdSense e Cookies de Terceiros:
              </strong>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.94rem' }}>
                <li>O Google, como fornecedor terceiro, utiliza cookies (incluindo cookies DoubleClick / DART) para veicular anúncios em nosso site com base nas visitas anteriores dos usuários a este ou a outros sites na internet.</li>
                <li>Os usuários podem desativar a publicidade personalizada acessando as <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-forest-800)', fontWeight: 600, textDecoration: 'underline' }}>Configurações de Anúncios do Google</a> ou através da plataforma <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-forest-800)', fontWeight: 600, textDecoration: 'underline' }}>aboutads.info</a>.</li>
                <li>Utilizamos uma Plataforma de Gestão de Consentimento (CMP) certificada pelo Google para coletar o consentimento explícito dos visitantes de acordo com as diretrizes do EEE, Reino Unido e Suíça.</li>
              </ul>
            </div>
          </section>

          {/* Seção 4: Transparência de Links de Afiliados */}
          <section>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--brand-forest-900)', marginBottom: '12px' }}>
              4. Transparência de Parcerias e Afiliados
            </h2>
            <p>
              O PetRankings participa de programas de parceiros afiliados com grandes varejistas brasileiros (como <em>Amazon Brasil, Petlove, Cobasi, Mercado Livre e Shopee</em>). Quando você clica em um botão de compra para visitar uma loja, podemos receber uma comissão caso você finalize um pedido.
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>Importante:</strong> Isso não acarreta nenhum custo adicional para você e não influencia de forma alguma a ordem das posições ou as notas médias calculadas no ranking, que são 100% matemáticas e imparciais.
            </p>
          </section>

          {/* Seção 5: Direitos do Usuário (LGPD/GDPR) */}
          <section>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--brand-forest-900)', marginBottom: '12px' }}>
              5. Seus Direitos como Titular de Dados
            </h2>
            <p>De acordo com a LGPD e o GDPR, você tem o direito de:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar ou solicitar a exclusão de mensagens enviadas por você;</li>
              <li>Revogar seu consentimento de cookies a qualquer momento através das opções do navegador ou do painel de privacidade.</li>
            </ul>
          </section>

          {/* Seção 6: Contato */}
          <section style={{ borderTop: '1px solid var(--border-cream-light)', paddingTop: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
              6. Como Entrar em Contato
            </h2>
            <p style={{ fontSize: '0.95rem' }}>
              Para qualquer dúvida sobre esta política de privacidade ou sobre seus dados pessoais, você pode entrar em contato com nossa equipe editorial através da nossa página de <Link href="/contato" style={{ color: 'var(--brand-forest-800)', fontWeight: 700, textDecoration: 'underline' }}>Contato</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
