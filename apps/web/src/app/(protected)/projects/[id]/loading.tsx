export default function ProjectLoading() {
  return (
    <section className="flex flex-col gap-4">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-8 w-72 animate-pulse rounded bg-muted" />
      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="h-28 animate-pulse rounded bg-muted" />
        <div className="h-28 animate-pulse rounded bg-muted" />
        <div className="h-28 animate-pulse rounded bg-muted" />
        <div className="h-28 animate-pulse rounded bg-muted" />
      </div>
    </section>
  );
}