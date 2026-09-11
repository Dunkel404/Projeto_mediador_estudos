import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShaderMath — Brutal Mathematics for 3D & Shaders',
  description: 'Plataforma de aprendizado matemático brutal e determinístico para Shaders GLSL/HLSL, Ray Marching e Computação Gráfica 3D.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0b0e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0a0b0e] text-slate-100 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
