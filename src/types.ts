import { CalendarSystem, SimpleDate } from "./calendars";

export interface TimeLineXEvent {
  filePath: string;
  title: string;
  timeline: string;
  startGregorian: SimpleDate;
  endGregorian: SimpleDate;
  startYear: number; // decimal year
  endYear: number; // decimal year (equal to startYear for point events)
  isRange: boolean;
  sourceCalendar: CalendarSystem;
}

export interface TimelineGroup {
  name: string;
  color: string;
  visible: boolean;
  events: TimeLineXEvent[];
}

export interface OrphanNote {
  filePath: string;
  title: string;
}

export type ZoomLevelId =
  | "1000yr"
  | "100yr"
  | "10yr"
  | "1yr"
  | "quarter"
  | "month"
  | "week"
  | "day";

export interface ZoomLevel {
  id: ZoomLevelId;
  label: string;
  yearsVisible: number;
}

export const ZOOM_LEVELS: ZoomLevel[] = [
  { id: "1000yr", label: "1000 yr", yearsVisible: 1000 },
  { id: "100yr", label: "100 yr", yearsVisible: 100 },
  { id: "10yr", label: "10 yr", yearsVisible: 10 },
  { id: "1yr", label: "1 yr", yearsVisible: 1 },
  { id: "quarter", label: "Quarter", yearsVisible: 0.25 },
  { id: "month", label: "Month", yearsVisible: 1 / 12 },
  { id: "week", label: "Week", yearsVisible: 7 / 365 },
  { id: "day", label: "Day", yearsVisible: 1 / 365 },
];

export const TIMELINE_PALETTE = [
  "#8b5cf6", // purple
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // green/teal
  "#6366f1", // indigo
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#84cc16", // lime
  "#f97316", // orange
];
