import type { Metadata } from 'next';
import './globals.css';
import './auth.css';
import './visual-system.css';
import './manager.css';
import './dashboard-premium.css';
import './command-system.css';
import './public-site.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: 'EB DO MIG | Central Militar',
  description: 'Central oficial do EB DO MIG para efetivo, treinamentos, promoções, divisões e auditoria militar integrada ao Roblox.',
  alternates:{canonical:'/'},
  keywords:['EB DO MIG','Exército Brasileiro Roblox','central militar Roblox','treinamentos Roblox'],
  openGraph: {title:'EB DO MIG | Central Militar',description:'Central de comando, capacitação e gestão militar do EB DO MIG.',images:['/og.png']},
  twitter: {card:'summary_large_image',title:'EB DO MIG | Central Militar',description:'Central de comando, capacitação e gestão militar do EB DO MIG.',images:['/og.png']},
};
export const viewport={themeColor:'#080c0a',colorScheme:'dark'};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout shares this stylesheet across all pages. */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
