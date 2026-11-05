import type { HTMLAttributes } from "react";
export { RangeCalendar } from "@/components/ui/primitives";
export type { DateRange } from "@/components/ui/primitives";
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
