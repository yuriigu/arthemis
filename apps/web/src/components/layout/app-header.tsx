import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppHeader({ className }: { className?: string }) {
  return (
    <header className={cn("flex items-center justify-end", className)}>
      <ThemeToggle />
    </header>
  );
}
