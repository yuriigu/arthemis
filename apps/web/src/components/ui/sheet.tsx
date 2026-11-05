import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogTitle } from "@/components/ui/dialog";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetOverlay = DialogOverlay;
export const SheetHeader = DialogHeader;
export const SheetFooter = DialogFooter;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
export const SheetPortal = DialogPrimitive.Portal;
export const SheetClose = DialogClose;
export function SheetContent({ side = "right", className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left" }) {
  const placement = {
    right: "inset-y-0 right-0 h-full max-h-none max-w-md translate-x-0 translate-y-0 rounded-none data-[state=open]:slide-in-from-right",
    left: "inset-y-0 left-0 h-full max-h-none max-w-md translate-x-0 translate-y-0 rounded-none data-[state=open]:slide-in-from-left",
    top: "inset-x-0 top-0 max-h-[80vh] max-w-none translate-x-0 translate-y-0 rounded-none data-[state=open]:slide-in-from-top",
    bottom: "inset-x-0 bottom-0 max-h-[80vh] max-w-none translate-x-0 translate-y-0 rounded-none data-[state=open]:slide-in-from-bottom",
  }[side];
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content className={cn("fixed z-50 grid gap-4 overflow-auto border border-border bg-card p-6 text-card-foreground shadow-lg outline-none transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500", placement, className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
