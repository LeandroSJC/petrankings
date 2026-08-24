import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['600', '700', '800', '900'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://petrankings.com.br';
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-2889031150261887';
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'bmf06L8G62Qwe_rb5epMccxaUByc1ICghJ9MdrW10qU';

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
  verification: {
    google: googleSiteVerification,
  },
  other: {
    'google-adsense-account': 'ca-pub-2889031150261887',
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
    <html lang="pt-BR" className={`${inter.variable} ${plusJakarta.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {adsenseClientId && (
          <Script
            id="google-adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
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
