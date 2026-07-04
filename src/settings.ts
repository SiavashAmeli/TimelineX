import { CalendarSystem } from "./calendars";

export interface TimeLineXSettings {
  displayCalendar: CalendarSystem;
  dateKey: string;
  dateEndKey: string;
  timelineKey: string;
  calendarKey: string;
  timelineColors: Record<string, string>;
  timelineOrder: string[];
  hiddenTimelines: string[];
  confirmDragEdits: boolean;
}

export const DEFAULT_SETTINGS: TimeLineXSettings = {
  displayCalendar: "gregorian",
  dateKey: "date",
  dateEndKey: "date_end",
  timelineKey: "timeline",
  calendarKey: "calendar",
  timelineColors: {},
  timelineOrder: [],
  hiddenTimelines: [],
  confirmDragEdits: true,
};
