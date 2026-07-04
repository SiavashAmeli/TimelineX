import { App, Component, TFile } from "obsidian";
import {
  CalendarSystem,
  decimalYearFromGregorian,
  parseFlexibleDate,
  toGregorian,
} from "./calendars";
import { TimeLineXSettings } from "./settings";
import { OrphanNote, TimeLineXEvent, TIMELINE_PALETTE, TimelineGroup } from "./types";

/**
 * Scans the vault's markdown frontmatter for date/timeline properties and
 * keeps a live, in-memory index. Rebuilds are cheap (metadata cache lookups
 * only, no disk reads) so we just re-scan on any relevant metadata change.
 */
export class TimeLineXIndex extends Component {
  private events: TimeLineXEvent[] = [];
  private missingTimeline: OrphanNote[] = [];
  private missingDate: OrphanNote[] = [];
  private listeners: Array<() => void> = [];

  constructor(private app: App, private settings: TimeLineXSettings) {
    super();
  }

  onload(): void {
    this.rebuild();
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.rebuild())
    );
    this.registerEvent(
      this.app.vault.on("delete", () => this.rebuild())
    );
    this.registerEvent(
      this.app.vault.on("rename", () => this.rebuild())
    );
  }

  onExternalChange(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }

  rebuild(): void {
    const events: TimeLineXEvent[] = [];
    const missingTimeline: OrphanNote[] = [];
    const missingDate: OrphanNote[] = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter;
      if (!fm) continue;

      const rawDate = fm[this.settings.dateKey];
      const rawTimeline = fm[this.settings.timelineKey];
      const hasDate = rawDate !== undefined && rawDate !== null && rawDate !== "";
      const hasTimeline =
        typeof rawTimeline === "string" && rawTimeline.trim() !== "";

      if (!hasDate && !hasTimeline) continue;
      if (hasDate && !hasTimeline) {
        missingTimeline.push({ filePath: file.path, title: file.basename });
        continue;
      }
      if (!hasDate && hasTimeline) {
        missingDate.push({ filePath: file.path, title: file.basename });
        continue;
      }

      const timeline = rawTimeline as string;
      const sourceCalendar: CalendarSystem =
        (fm[this.settings.calendarKey] as CalendarSystem) || "gregorian";

      const start = parseFlexibleDate(rawDate);
      if (!start) continue;
      const rawEnd = fm[this.settings.dateEndKey];
      const end = parseFlexibleDate(rawEnd) ?? start;

      const startGregorian = toGregorian(sourceCalendar, start);
      const endGregorian = toGregorian(sourceCalendar, end);

      const startYear = decimalYearFromGregorian(startGregorian);
      const endYearRaw = decimalYearFromGregorian(endGregorian);
      const endYear = Math.max(startYear, endYearRaw);

      events.push({
        filePath: file.path,
        title: file.basename,
        timeline,
        startGregorian,
        endGregorian,
        startYear,
        endYear,
        isRange: endYear > startYear,
        sourceCalendar,
      });
    }

    events.sort((a, b) => a.startYear - b.startYear);
    this.events = events;
    this.missingTimeline = missingTimeline;
    this.missingDate = missingDate;
    this.notify();
  }

  getAllEvents(): TimeLineXEvent[] {
    return this.events;
  }

  getOrphansMissingTimeline(): OrphanNote[] {
    return this.missingTimeline;
  }

  getOrphansMissingDate(): OrphanNote[] {
    return this.missingDate;
  }

  getTimelineGroups(): TimelineGroup[] {
    const names: string[] = [];
    for (const e of this.events) {
      if (!names.includes(e.timeline)) names.push(e.timeline);
    }

    // Keep a stable order: previously known timelines first (in the order
    // they were first seen / stored in settings), then any brand-new ones.
    const known = this.settings.timelineOrder.filter((n) => names.includes(n));
    const fresh = names.filter((n) => !known.includes(n));
    const order = [...known, ...fresh];
    this.settings.timelineOrder = order;

    return order.map((name, i) => {
      if (!this.settings.timelineColors[name]) {
        this.settings.timelineColors[name] =
          TIMELINE_PALETTE[i % TIMELINE_PALETTE.length];
      }
      return {
        name,
        color: this.settings.timelineColors[name],
        visible: !this.settings.hiddenTimelines.includes(name),
        events: this.events.filter((e) => e.timeline === name),
      };
    });
  }

  getFile(path: string): TFile | null {
    const f = this.app.vault.getAbstractFileByPath(path);
    return f instanceof TFile ? f : null;
  }

  /** Renames a timeline across every note that belongs to it. */
  async renameTimelineAcrossNotes(oldName: string, newName: string): Promise<void> {
    if (oldName === newName || !newName.trim()) return;
    const paths = this.events
      .filter((e) => e.timeline === oldName)
      .map((e) => e.filePath);
    for (const path of paths) {
      const file = this.getFile(path);
      if (!file) continue;
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        fm[this.settings.timelineKey] = newName;
      });
    }
    this.rebuild();
  }

  /** Reassigns every note in sourceName to targetName (an existing timeline). */
  async mergeTimelineAcrossNotes(sourceName: string, targetName: string): Promise<void> {
    await this.renameTimelineAcrossNotes(sourceName, targetName);
  }

  /**
   * Removes the timeline property from every note that has it, ungrouping
   * them. Their date/date_end properties are left untouched, so they'll show
   * up in the "missing timeline" hint afterwards rather than disappearing.
   */
  async clearTimelineAcrossNotes(name: string): Promise<void> {
    const paths = this.events
      .filter((e) => e.timeline === name)
      .map((e) => e.filePath);
    for (const path of paths) {
      const file = this.getFile(path);
      if (!file) continue;
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        delete fm[this.settings.timelineKey];
      });
    }
    this.rebuild();
  }
}
