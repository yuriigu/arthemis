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
    <html lang="pt-BR" className="h-full">
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
