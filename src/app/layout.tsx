import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Soroswap DEX | Stellar Token Swap',
  description: 'Swap tokens on Stellar using Soroswap aggregator and Freighter wallet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans bg-gray-950 text-white min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
