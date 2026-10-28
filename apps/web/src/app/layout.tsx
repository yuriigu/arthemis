import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

// Fontes do projeto legado, self-hosted (mesmos pacotes do /legacy)
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/lora";

import { AuthProvider } from "@/contexts/AuthContext";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Arthemis",
    template: "%s | Arthemis",
  },
  description: "Plataforma Arthemis — observação e gestão de projetos",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <head />
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        {/* Aplica o tema salvo antes da hidratação do React para evitar FOUC */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{const s=localStorage.getItem('arthemis_theme');const m=window.matchMedia('(prefers-color-scheme: dark)').matches;const t=s==='light'||s==='dark'||s==='system'?s:'system';const dark=t==='dark'||(t==='system'&&m);if(dark)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})()`,
          }}
        />
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
