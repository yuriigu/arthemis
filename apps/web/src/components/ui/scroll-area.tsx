import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

export function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-2.5 touch-none select-none p-0.5 transition-colors"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner className="bg-border" />
    </ScrollAreaPrimitive.Root>
  );
}

export function ScrollAreaScrollbar({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  return <div aria-hidden="true" className={orientation === "vertical" ? "absolute right-0 top-0 h-full w-1 bg-muted" : "absolute bottom-0 left-0 h-1 w-full bg-muted"} />;
}
