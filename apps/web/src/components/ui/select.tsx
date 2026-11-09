"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectChangeEvent = { target: { value: string } };
type NativeOption = React.ReactElement<{
  value?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}>;

export interface SelectProps
  extends Pick<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "required" | "disabled"> {
  className?: string;
  children: React.ReactNode;
  value?: string | number | null;
  defaultValue?: string | number | null;
  onChange?: (event: SelectChangeEvent) => void;
  id?: string;
  autoFocus?: boolean;
  form?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  id,
  autoFocus,
  form,
  ...props
}: SelectProps) {
  const options = React.Children.toArray(children).filter(
    (child): child is NativeOption => React.isValidElement(child) && child.type === "option",
  );
  const placeholder = options.find((option) => option.props.value === "")?.props.children;
  const items = options.filter((option) => option.props.value !== "");

  return (
    <SelectPrimitive.Root
      name={name}
      required={required}
      disabled={disabled}
      value={value == null || String(value) === "" ? undefined : String(value)}
      defaultValue={defaultValue == null || String(defaultValue) === "" ? undefined : String(defaultValue)}
      onValueChange={(nextValue) => onChange?.({ target: { value: nextValue } })}
    >
      <SelectPrimitive.Trigger
        id={id}
        autoFocus={autoFocus}
        form={form}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          className="z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
            <ChevronUp className="size-4" aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {items.map((option, index) => {
              const optionValue = option.props.value ?? String(index);
              return (
                <SelectPrimitive.Item
                  key={option.key ?? optionValue}
                  value={optionValue}
                  disabled={option.props.disabled}
                  className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 flex size-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="size-4" aria-hidden="true" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.props.children}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="size-4" aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
