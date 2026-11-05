export { ScrollArea } from "@/components/ui/primitives";
export function ScrollAreaScrollbar({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  return <div aria-hidden="true" className={orientation === "vertical" ? "absolute right-0 top-0 h-full w-1 bg-muted" : "absolute bottom-0 left-0 h-1 w-full bg-muted"} />;
}
