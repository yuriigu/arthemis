import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <section className="w-full space-y-6" aria-busy="true" aria-label="Carregando página">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </section>
  );
}
