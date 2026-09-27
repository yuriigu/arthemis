import type { ReactNode } from "react";

/**
 * Layout do grupo de rotas `(auth)` — telas públicas/autenticadas (login).
 *
 * Possui layout próprio e isolado: NÃO renderiza o Shell do sistema
 * (Sidebar, Header ou barras de navegação do Dashboard). O conteúdo da rota
 * ocupa a viewport inteira (`min-h-dvh`) e define seu próprio container.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh w-full flex-col">{children}</div>;
}
