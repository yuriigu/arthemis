import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FormCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("rounded-xl", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function FormFieldWrapper({
  title,
  items,
  itemTitlePrefix,
  addLabel,
  onAdd,
  onRemove,
  children,
}: {
  title: string;
  items: unknown[];
  itemTitlePrefix: string;
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  children: (index: number) => ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <button type="button" onClick={onAdd} className="text-sm font-medium text-foreground underline underline-offset-4">{addLabel}</button>
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>}
      {items.map((_, index) => (
        <fieldset key={index} className="space-y-4 rounded-md bg-background p-4">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium">{itemTitlePrefix} {index + 1}</legend>
            <button type="button" onClick={() => onRemove(index)} aria-label={`Remover ${itemTitlePrefix.toLowerCase()} ${index + 1}`} className="text-sm text-destructive hover:underline">Remover</button>
          </div>
          <div className="flex flex-wrap gap-4">{children(index)}</div>
        </fieldset>
      ))}
    </section>
  );
}
