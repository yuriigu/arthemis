"use client";

import { Apple } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SocialAuthButtons() {
  return (
    <>
      <div className="my-1 flex items-center gap-3" aria-label="Ou">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm font-normal text-muted-foreground">Ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled
          title="O início de sessão com Google ainda não está disponível."
          aria-label="Continuar com Google, indisponível"
          className="border-input bg-background text-foreground"
        >
          <span aria-hidden="true" className="font-bold text-primary">G</span>
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title="O início de sessão com Apple ainda não está disponível."
          aria-label="Continuar com Apple, indisponível"
          className="border-input bg-background text-foreground"
        >
          <Apple className="size-4 fill-current" aria-hidden="true" />
          Apple
        </Button>
      </div>
    </>
  );
}
