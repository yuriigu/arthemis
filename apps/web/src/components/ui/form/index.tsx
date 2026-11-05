import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Form({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props}>{children}</form>;
}
export function FormField({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props}>{children}</div>;
}
export function FormControl({ children }: { children: ReactNode }) { return <div>{children}</div>; }
export function FormLabel(props: React.LabelHTMLAttributes<HTMLLabelElement>) { return <Label {...props} />; }
export function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
export function FormFieldErrors({ children }: { children?: ReactNode }) {
  return children ? <p role="alert" className="text-sm text-destructive">{children}</p> : null;
}
export function FormFieldset({ className, ...props }: React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return <fieldset className={cn("space-y-3", className)} {...props} />;
}
export function FormLegend({ className, ...props }: React.HTMLAttributes<HTMLLegendElement>) {
  return <legend className={cn("font-medium", className)} {...props} />;
}
export function FormButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-sage-green-700 disabled:opacity-50" {...props} />;
}
export const FormElementField = FormField;
