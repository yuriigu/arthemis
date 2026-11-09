"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipPortal = TooltipPrimitive.Portal;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export function TooltipContent({ className, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return <TooltipPrimitive.Content className={cn("z-50 overflow-hidden rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground shadow-md", className)} {...props} />;
}
