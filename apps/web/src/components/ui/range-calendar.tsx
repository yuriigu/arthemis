import type { HTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DateRange {
  start?: string;
  end?: string;
}

export function RangeCalendar({
  className,
  value,
  onChange,
}: {
  className?: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Input
        aria-label="Data inicial"
        type="date"
        value={value.start ?? ""}
        onChange={(event) => onChange({ ...value, start: event.target.value })}
      />
      <span className="text-sm text-muted-foreground">até</span>
      <Input
        aria-label="Data final"
        type="date"
        min={value.start}
        value={value.end ?? ""}
        onChange={(event) => onChange({ ...value, end: event.target.value })}
      />
    </div>
  );
}
export {
  CalendarCaption as RangeCalendarCaption,
  CalendarCell as RangeCalendarCell,
  CalendarDay as RangeCalendarDay,
  CalendarGridBody as RangeCalendarGridBody,
  CalendarGridHead as RangeCalendarGridHead,
  CalendarGridRow as RangeCalendarGridRow,
  CalendarGrid as RangeCalendarGrid,
  CalendarHeadCell as RangeCalendarHeadCell,
  CalendarHeader as RangeCalendarHeader,
  CalendarHeading as RangeCalendarHeading,
  CalendarMonthSelect as RangeCalendarMonthSelect,
  CalendarMonth as RangeCalendarMonth,
  CalendarMonths as RangeCalendarMonths,
  CalendarNav as RangeCalendarNav,
  CalendarNextButton as RangeCalendarNextButton,
  CalendarPrevButton as RangeCalendarPrevButton,
  CalendarYearSelect as RangeCalendarYearSelect,
} from "@/components/ui/calendar";
export function RangeCalendarWrapper({ children, ...props }: HTMLAttributes<HTMLDivElement>) { return <div {...props}>{children}</div>; }
