import type { Metadata } from "next";
// 1. Import de la police depuis Google Fonts via Next.js
import { Inter } from "next/font/google"; 
import "./globals.css";

// 2. Configuration de la police (subsets latin pour les accents)
const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"], // On charge les graisses utiles
  variable: "--font-inter", // Variable CSS pour Tailwind
});

export const metadata: Metadata = {
  title: "Mon Portfolio 3D",
  description: "Portfolio interactif",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      {/* 3. Application de la classe au body */}
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}