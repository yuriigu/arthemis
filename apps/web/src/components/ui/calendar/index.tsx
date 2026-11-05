import type { HTMLAttributes, ReactNode } from "react";
export { Calendar } from "@/components/ui/primitives";
export type CalendarProps = React.InputHTMLAttributes<HTMLInputElement>;
export function CalendarHeader({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className="flex items-center justify-between" {...props}>{children}</div>; }
export function CalendarCaption({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className="flex items-center justify-center" {...props}>{children}</div>; }
export function CalendarHeading({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h3 className="text-sm font-medium" {...props}>{children}</h3>; }
export function CalendarGrid({ children, ...props }: HTMLAttributes<HTMLTableElement>) { return <table className="w-full border-collapse" {...props}>{children}</table>; }
export function CalendarGridHead({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <thead {...props}>{children}</thead>; }
export function CalendarGridBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props}>{children}</tbody>; }
export function CalendarGridRow({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) { return <tr {...props}>{children}</tr>; }
export function CalendarHeadCell({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) { return <th className="p-2 text-center text-xs text-muted-foreground" {...props}>{children}</th>; }
export function CalendarCell({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) { return <td className="p-1 text-center" {...props}>{children}</td>; }
export function CalendarDay({ children, ...props }: HTMLAttributes<HTMLButtonElement>) { return <button type="button" className="size-8 rounded hover:bg-accent" {...props}>{children}</button>; }
export function CalendarMonth({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div {...props}>{children}</div>; }
export function CalendarMonths({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className="flex gap-4" {...props}>{children}</div>; }
export function CalendarNav({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className="flex items-center gap-1" {...props}>{children}</div>; }
export function CalendarPrevButton({ children = "‹", ...props }: HTMLAttributes<HTMLButtonElement>) { return <button type="button" aria-label="Mês anterior" {...props}>{children as ReactNode}</button>; }
export function CalendarNextButton({ children = "›", ...props }: HTMLAttributes<HTMLButtonElement>) { return <button type="button" aria-label="Próximo mês" {...props}>{children as ReactNode}</button>; }
export function CalendarMonthSelect({ children, ...props }: HTMLAttributes<HTMLSelectElement>) { return <select aria-label="Mês" {...props}>{children}</select>; }
export function CalendarYearSelect({ children, ...props }: HTMLAttributes<HTMLSelectElement>) { return <select aria-label="Ano" {...props}>{children}</select>; }
