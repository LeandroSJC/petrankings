import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, HeartHandshake, Calculator, ArrowLeft, Heart, Sparkles } from 'lucide-react';
import AdPlaceholder from '@/components/AdPlaceholder';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nossa História & Como Avaliamos com Carinho',
  description: 'Conheça o propósito, a equipe e os critérios matemáticos e manuais que utilizamos para calcular os rankings e notas de produtos para pets.',
  alternates: {
    canonical: '/sobre',
  },
};

export default function SobrePage() {
  return (
    <div style={{ paddingBottom: '72px' }}>
      {/* Header Institucional Acolhedor */}
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
            <Heart size={16} color="var(--gold-700)" aria-hidden="true" fill="var(--gold-700)" />
            <span>Nosso Propósito & Compromisso com Você</span>
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
            Criamos o PetRankings para que você nunca mais se sinta perdido na hora de escolher a ração, o brinquedo ou os cuidados do seu melhor amigo de quatro patas. Aqui, a voz de milhares de tutores reais se transforma em rankings claros, fáceis de entender e 100% sinceros.
          </p>
        </div>
      </section>

      <div
        className="container"
        style={{ maxWidth: '880px', marginTop: '44px', display: 'flex', flexDirection: 'column', gap: '48px' }}
      >
        {/* 1. Nossa Missão */}
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
              Por que fazemos o que fazemos?
            </h2>
          </div>
          <p style={{ color: 'var(--text-body)', lineHeight: 1.75, fontSize: '1.05rem' }}>
            Quem tem cão ou gato em casa sabe: são tantas marcas, tipos de ração, areias sanitárias e acessórios que fica difícil saber o que realmente funciona e agrada aos pets. O <strong>PetRankings</strong> nasceu para ser o seu porto seguro: organizamos produtos em categorias certinhas, registramos as notas de compradores nas maiores lojas do país e calculamos uma classificação totalmente transparente.
          </p>
          <p style={{ color: 'var(--text-body)', lineHeight: 1.75, fontSize: '1.05rem' }}>
            Não vendemos produtos diretamente, não temos carrinho de compras próprio e jamais criamos avaliações fictícias. Tudo o que você vê aqui foi apurado e organizado com muito carinho e rigor por nossa equipe.
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
                Critérios simples, matemáticos e sem segredos
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
                  fontFamily: 'var(--font-serif)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                1
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Reunimos as notas das 5 maiores lojas online
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  Nossa equipe pesquisa e cadastra manualmente as notas atribuídas pelos compradores nas maiores lojas online do Brasil: <strong>Amazon, Mercado Livre, Petlove, Cobasi e Shopee</strong>. Apenas notas válidas de 0 a 5 estrelas são consideradas.
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
                  fontFamily: 'var(--font-serif)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                2
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Calculamos a média simples e justa
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  Somamos todas as notas registradas nas lojas parceiras e dividimos pela quantidade de lojas disponíveis. O resultado é uma nota média nítida e arredondada em duas casas decimais (ex: 4.85 ★).
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
                  fontFamily: 'var(--font-serif)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                3
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  A maior nota média assume o topo (#1 Ouro)
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  A ordem no ranking é automática: o produto com a pontuação mais alta fica em 1º lugar com medalha de ouro, seguido pelo 2º lugar (prata), 3º lugar (bronze) e assim sucessivamente.
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
                  fontFamily: 'var(--font-serif)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                4
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Desempate pelo carinho de mais tutores
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  Se dois produtos tiverem a mesma nota média exata, o desempate é decidido pelo volume total de avaliações somadas entre as lojas. O produto testado e aprovado por mais tutores fica à frente.
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
                  fontFamily: 'var(--font-serif)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                5
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                  Acesso direto às lojas e transparência de parcerias
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.68 }}>
                  Nossos botões levam você diretamente para as páginas oficiais das lojas. Alguns links podem conter códigos de parceiro afiliado, pelos quais podemos receber uma comissão caso você compre, sem nenhum custo a mais para você. Isso mantém nosso site 100% gratuito e nunca afeta notas ou posições!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Espaço de Anúncio Reservado */}
        <AdPlaceholder label="Espaço Publicitário Reservado" />

        {/* 3. Princípios e Limites Responsáveis */}
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
              Amor, Respeito & Orientação Veterinária
            </h2>
          </div>
          <p style={{ color: 'var(--text-body)', fontSize: '1.02rem', lineHeight: 1.75 }}>
            O PetRankings não substitui a consulta nem a orientação de um médico veterinário. Cada cão e gato possui necessidades nutricionais, de saúde e comportamento únicas. Nossos rankings servem como um ponto de partida para economizar tempo e comparar a satisfação de outros tutores — mas para cuidados de saúde, consulte sempre o veterinário de sua confiança!
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
            Explorar Rankings com Amor 🐾
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
            Mandar um Oi ou Sugestão
          </Link>
        </div>
      </div>
    </div>
  );
}
