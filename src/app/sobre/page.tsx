import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, Calculator, ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';
import { getAdSlotsMap } from '@/lib/ads';
import AdSlotRenderer from '@/components/AdSlotRenderer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre o PetRankings & Como Avaliamos os Produtos',
  description: 'Conheça o propósito, a metodologia matemática e o compromisso de transparência editorial do PetRankings.',
  alternates: {
    canonical: '/sobre',
  },
};

export default async function SobrePage() {
  const adSlots = await getAdSlotsMap();
  return (
    <div style={{ paddingBottom: '72px' }}>
      {/* Header Institucional */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1.5px solid var(--border-cream)',
          padding: '56px 0 44px 0',
          backgroundImage:
            'radial-gradient(ellipse at 85% 15%, rgba(212, 175, 55, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(15, 54, 35, 0.05) 0%, transparent 55%)',
        }}
      >
        <div className="container" style={{ maxWidth: '880px' }}>
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
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar para a página inicial</span>
          </Link>

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
              marginBottom: '18px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <ShieldCheck size={16} color="var(--brand-forest-700)" aria-hidden="true" />
            <span>Transparência Editorial & Metodologia</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.3rem, 4.2vw, 3.3rem)',
              marginBottom: '18px',
              lineHeight: 1.18,
              color: 'var(--brand-forest-900)',
            }}
          >
            Sobre o PetRankings
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-body)', lineHeight: 1.68 }}>
            O <strong>PetRankings</strong> é um guia comparador independente criado para ajudar tutores de cães e gatos a tomarem decisões de compra mais conscientes, rápidas e seguras. Consolidamos as notas e opiniões reais de quem já comprou e testou produtos nas maiores lojas de e-commerce do Brasil.
          </p>
        </div>
      </section>

      <div
        className="container"
        style={{ maxWidth: '880px', marginTop: '44px', display: 'flex', flexDirection: 'column', gap: '48px' }}
      >
        {/* 1. Nossa Proposta */}
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '38px',
            border: '1.5px solid var(--border-cream)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={28} color="var(--brand-forest-700)" aria-hidden="true" />
            <h2 style={{ fontSize: '1.8rem', color: 'var(--brand-forest-900)' }}>
              O que fazemos e por que existimos
            </h2>
          </div>
          <p style={{ color: 'var(--text-body)', lineHeight: 1.75, fontSize: '1.05rem' }}>
            O mercado pet brasileiro conta com centenas de opções de rações, areias sanitárias, petiscos e brinquedos. Analisar individualmente a reputação de cada produto em múltiplos sites exige muito tempo e paciência.
          </p>
          <p style={{ color: 'var(--text-body)', lineHeight: 1.75, fontSize: '1.05rem' }}>
            Nossa equipe pesquisa, organiza por categorias específicas e calcula a nota média consolidada dos principais itens disponíveis no mercado. <strong>Não vendemos produtos diretamente</strong>, não possuímos estoque e não processamos pagamentos: nosso papel é 100% informativo e comparativo.
          </p>
        </section>

        {/* 2. Seção Central Metodológica: Como Calculamos */}
        <section
          id="como-calculamos"
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid var(--border-cream)',
            borderRadius: 'var(--radius-xl)',
            padding: '44px 38px',
            boxShadow: 'var(--shadow-md)',
            scrollMarginTop: '100px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '26px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--brand-forest-50)',
                color: 'var(--brand-forest-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-xs)',
                border: '1.5px solid var(--brand-forest-200)',
              }}
            >
              <Calculator size={26} aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.85rem', color: 'var(--brand-forest-900)', lineHeight: 1.2 }}>
                Como calculamos as notas e rankings
              </h2>
              <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Critérios objetivos, matemáticos e transparentes
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '28px' }}>
            {/* Passo 1 */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                1
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Coleta de notas nas 5 maiores lojas parceiras
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  Registramos periodicamente as avaliações públicas deixadas por compradores reais em cinco grandes plataformas de comércio eletrônico no Brasil: <strong>Amazon, Mercado Livre, Petlove, Cobasi e Shopee</strong>.
                </p>
              </div>
            </div>

            {/* Passo 2 */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                2
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Cálculo da média simples
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  A pontuação consolidada é a média aritmética das notas válidas (de 0 a 5) registradas para o produto nas lojas parceiras, arredondada em duas casas decimais (exemplo: 4.85 ★).
                </p>
              </div>
            </div>

            {/* Passo 3 */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                3
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Ordenação automática pelo desempenho (#1 ao #N)
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  O posicionamento nos rankings é 100% automático: o item com maior média assume o 1º lugar (medalha de ouro), seguido pelo 2º (prata), 3º (bronze) e demais posições. Nenhuma marca pode comprar posições.
                </p>
              </div>
            </div>

            {/* Passo 4 */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                4
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Critério de desempate por volume de avaliações
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  Caso dois produtos apresentem a mesma nota média exata, o desempate é definido pela soma total de avaliações recebidas nas lojas, priorizando o produto com maior amostragem de consumidores.
                </p>
              </div>
            </div>

            {/* Passo 5 */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                5
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Links de lojas e modelo de sustentabilidade
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  Para facilitar a sua compra, disponibilizamos links diretos para as páginas oficiais das lojas parceiras. Como forma de monetização para manter o serviço gratuito e atualizado, participamos de programas de afiliados e podemos receber uma comissão caso você decida comprar — sem nenhum custo adicional para você. Esse relacionamento comercial jamais afeta as notas ou as posições dos rankings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Espaço de Anúncio Rodapé / Artigo */}
        {adSlots['rodape']?.isActive && (
          <AdSlotRenderer slot={adSlots['rodape']} />
        )}

        {/* 3. Princípios e Aviso Veterinário */}
        <section
          style={{
            backgroundColor: 'var(--bg-cream-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '38px',
            border: '1.5px solid var(--border-cream)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <HeartHandshake size={26} color="var(--brand-forest-700)" aria-hidden="true" />
            <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-forest-900)' }}>
              Aviso Importante: Orientação Veterinária
            </h2>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '1.02rem', lineHeight: 1.75 }}>
            O PetRankings é um serviço editorial e comparador de mercado. O conteúdo aqui disponibilizado não substitui consultas, diagnósticos ou prescrições médicas. Cada cão e gato possui necessidades nutricionais, clínicas e comportamentais específicas. Antes de realizar trocas na ração ou no manejo de saúde do seu animal, consulte sempre um médico veterinário.
          </p>
        </section>

        {/* Botões de Retorno e Contato (WCAG 2.5.5 Touch Target >= 44px) */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link
            href="/"
            className="hero-primary-btn"
            style={{
              backgroundColor: 'var(--brand-forest-800)',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.98rem',
              boxShadow: 'var(--shadow-emerald)',
              minHeight: '48px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Explorar Rankings
          </Link>

          <Link
            href="/contato"
            className="hero-secondary-btn"
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--brand-forest-900)',
              padding: '14px 28px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.98rem',
              border: '1.5px solid var(--border-cream)',
              minHeight: '48px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Fale Conosco
          </Link>
        </div>
      </div>
    </div>
  );
}
