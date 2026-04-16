import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'lowpix — Pixel Art Editor',
  description: 'A fast, minimal browser-based pixel art editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
