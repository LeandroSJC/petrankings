import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Playfair_Display, Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://petrankings.com.br';
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PetRankings — O Guia Amigo para Escolher o Melhor para o seu Pet',
    template: '%s | PetRankings',
  },
  description: 'Comparações transparentes e carinhosas de produtos para cães e gatos. Reunimos avaliações reais das melhores lojas do Brasil para você cuidar do seu melhor amigo com toda a tranquilidade.',
  keywords: [
    'pet',
    'melhores produtos pet',
    'melhor ração para cães',
    'melhor ração para gatos',
    'areia para gatos',
    'brinquedos para cachorro',
    'avaliações de produtos pet',
    'guia de compras pet',
    'cuidados com pets',
  ],
  authors: [{ name: 'Equipe Editorial PetRankings', url: siteUrl }],
  creator: 'PetRankings',
  publisher: 'PetRankings',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'PetRankings',
    title: 'PetRankings — O Guia Amigo para Escolher o Melhor para o seu Pet',
    description: 'Comparações sinceras e transparentes baseadas nas avaliações reais de tutores nas principais lojas do Brasil.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PetRankings — O Guia Amigo para Escolher o Melhor para o seu Pet',
    description: 'Comparações sinceras e transparentes baseadas nas avaliações reais de tutores nas principais lojas do Brasil.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${plusJakarta.variable} ${outfit.variable}`}>
      <head>
        {adsenseClientId && (
          <Script
            id="google-adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <ToastProvider>
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', outline: 'none' }}
          >
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
