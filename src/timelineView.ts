import { ItemView, Menu, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import {
  CALENDAR_FULL_NAMES,
  CALENDAR_MONTH_NAMES,
  CalendarSystem,
  decimalYearFromGregorian,
  decimalYearToGregorian,
  fromGregorian,
  gregorianToJdn,
  jdnToGregorian,
  monthStartJdn,
  toFrontmatterDateString,
} from "./calendars";
import { TimeLineXIndex } from "./timelineIndex";
import { TimeLineXSettings } from "./settings";
import { TimeLineXEvent, TimelineGroup, ZOOM_LEVELS } from "./types";
import {
  ConfirmModal,
  MergeTimelineModal,
  NewEventData,
  NewEventModal,
  OrphanListModal,
  RenameTimelineModal,
} from "./modals";

export const VIEW_TYPE_TIMELINEX = "timelinex-view";

// The slider's 100% end always shows exactly this many years, per spec.
const MIN_YEARS_VISIBLE = 7 / 365;

interface TickUnit {
  years: number;
  kind: "day" | "week" | "month" | "quarter" | "year";
}

// Ordered from finest to coarsest. Whichever is the *first* one that both
// (a) gives ticks enough pixel spacing to be readable, and (b) doesn't
// produce an unreasonable number of ticks across the whole domain, wins.
const TICK_UNITS: TickUnit[] = [
  { years: 1 / 365.2425, kind: "day" },
  { years: 7 / 365.2425, kind: "week" },
  { years: 1 / 12, kind: "month" },
  { years: 0.25, kind: "quarter" },
  { years: 1, kind: "year" },
  { years: 2, kind: "year" },
  { years: 5, kind: "year" },
  { years: 10, kind: "year" },
  { years: 20, kind: "year" },
  { years: 25, kind: "year" },
  { years: 50, kind: "year" },
  { years: 100, kind: "year" },
  { years: 200, kind: "year" },
  { years: 250, kind: "year" },
  { years: 500, kind: "year" },
  { years: 1000, kind: "year" },
  { years: 2000, kind: "year" },
  { years: 2500, kind: "year" },
  { years: 5000, kind: "year" },
  { years: 10000, kind: "year" },
];

function pickTickUnit(
  pixelsPerYear: number,
  totalYears: number,
  minPx = 90,
  maxTicks = 500
): TickUnit {
  for (const u of TICK_UNITS) {
    const spacingOk = u.years * pixelsPerYear >= minPx;
    const countOk = totalYears / u.years <= maxTicks;
    if (spacingOk && countOk) return u;
  }
  return TICK_UNITS[TICK_UNITS.length - 1];
}

/**
 * Formats a year-level (or coarser) tick label with BC/AD, and groups into
 * "1900s" / "60s" / "1000s" style labels once the interval is 10+ years.
 */
function formatYearTickLabel(astronomicalYear: number, intervalYears: number): string {
  const rounded = Math.round(astronomicalYear);
  const isBC = rounded <= 0;
  const civilYear = isBC ? 1 - rounded : rounded; // astronomical 0 = 1 BC
  const era = isBC ? "BC" : "AD";
  if (intervalYears >= 10) {
    const base = Math.floor(civilYear / intervalYears) * intervalYears;
    return `${base}s ${era}`;
  }
  return `${civilYear} ${era}`;
}

function assignLanes(
  events: TimeLineXEvent[],
  minGapYears: number
): Map<TimeLineXEvent, number> {
  const sorted = [...events].sort((a, b) => a.startYear - b.startYear);
  const laneEnds: number[] = [];
  const map = new Map<TimeLineXEvent, number>();
  for (const e of sorted) {
    let lane = laneEnds.findIndex((end) => end <= e.startYear);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e.endYear + minGapYears);
    } else {
      laneEnds[lane] = e.endYear + minGapYears;
    }
    map.set(e, lane);
  }
  return map;
}

function todayDecimalYear(): number {
  const now = new Date();
  const y = now.getFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (now.getTime() - start) / (end - start);
}

/** Maps a 0-100 zoom percent to how many years are visible in the viewport. */
function yearsVisibleForPercent(percent: number, totalYears: number): number {
  const maxYears = Math.max(totalYears, MIN_YEARS_VISIBLE * 2);
  const ratio = MIN_YEARS_VISIBLE / maxYears;
  return maxYears * Math.pow(ratio, percent / 100);
}

/** Inverse of yearsVisibleForPercent, used so preset buttons can set the slider. */
function percentForYearsVisible(yearsVisible: number, totalYears: number): number {
  const maxYears = Math.max(totalYears, MIN_YEARS_VISIBLE * 2);
  const ratio = MIN_YEARS_VISIBLE / maxYears;
  if (ratio <= 0 || ratio >= 1) return 0;
  const clamped = Math.min(Math.max(yearsVisible, MIN_YEARS_VISIBLE), maxYears);
  const p = (100 * Math.log(clamped / maxYears)) / Math.log(ratio);
  return Math.min(100, Math.max(0, p));
}

// Max safe content width to keep the browser happy at extreme zoom levels.
const MAX_CONTENT_PX = 4_000_000;
// Minimum pixel gap between an event's start and the point it's considered "0 duration".
const MIN_EVENT_SPAN_YEARS = 0.01;

export class TimeLineXView extends ItemView {
  private zoomPercent = 0; // 0 = whole timeline visible, 100 = ~7 days visible
  private soloTimeline: string | null = null;
  private unsubscribe: (() => void) | null = null;

  // Captured on every canvas render so the wheel-zoom handler can zoom
  // exactly to the cursor position after a full re-render.
  private lastDataMin = 0;
  private lastPixelsPerYear = 1;

  constructor(
    leaf: WorkspaceLeaf,
    private index: TimeLineXIndex,
    private settings: TimeLineXSettings,
    private saveSettings: () => Promise<void>
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_TIMELINEX;
  }
  getDisplayText(): string {
    return "TimeLineX";
  }
  getIcon(): string {
    return "clock";
  }

  async onOpen(): Promise<void> {
    this.containerEl.addClass("timelinex-root");
    this.unsubscribe = this.index.onExternalChange(() => this.render());
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.unsubscribe) this.unsubscribe();
  }

  private async persist(): Promise<void> {
    await this.saveSettings();
    this.render();
  }

  private render(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("timelinex-view");

    const groups = this.index.getTimelineGroups();
    const sidebar = root.createDiv({ cls: "timelinex-sidebar" });
    const main = root.createDiv({ cls: "timelinex-main" });

    this.renderSidebar(sidebar, groups);
    this.renderMain(main, groups);
  }

  // ---------------- Sidebar ----------------

  private renderSidebar(sidebar: HTMLElement, groups: TimelineGroup[]): void {
    const header = sidebar.createDiv({ cls: "timelinex-sidebar-header" });
    const titleRow = header.createDiv({ cls: "timelinex-sidebar-title" });
    setIcon(titleRow.createSpan({ cls: "timelinex-title-icon" }), "layers");
    titleRow.createSpan({
      text: this.soloTimeline ? this.soloTimeline : "Master Timeline",
    });
    header.createDiv({
      cls: "timelinex-sidebar-subtitle",
      text: this.soloTimeline
        ? "Viewing a single timeline."
        : "Overlay all timelines on one axis.",
    });

    // Timelines list
    const listSection = sidebar.createDiv({ cls: "timelinex-section timelinex-timelines-section" });
    const listHeader = listSection.createDiv({ cls: "timelinex-section-label-row" });
    listHeader.createSpan({ cls: "timelinex-section-label", text: "TIMELINES" });
    const linkRow = listHeader.createDiv({ cls: "timelinex-link-row" });
    const allLink = linkRow.createEl("a", { text: "All" });
    allLink.onclick = () => {
      this.settings.hiddenTimelines = [];
      void this.persist();
    };
    linkRow.createSpan({ text: " " });
    const noneLink = linkRow.createEl("a", { text: "None" });
    noneLink.onclick = () => {
      this.settings.hiddenTimelines = groups.map((g) => g.name);
      void this.persist();
    };

    const list = listSection.createDiv({ cls: "timelinex-timelines-list" });
    if (groups.length === 0) {
      list.createDiv({
        cls: "timelinex-empty-hint",
        text: `Add "${this.settings.timelineKey}" and "${this.settings.dateKey}" properties to a note's frontmatter to see it here.`,
      });
    }
    for (const g of groups) {
      const row = list.createDiv({ cls: "timelinex-timeline-row" });
      const top = row.createDiv({ cls: "timelinex-timeline-row-top" });

      const colorInput = top.createEl("input", { cls: "timelinex-color-dot" });
      colorInput.type = "color";
      colorInput.value = g.color;
      colorInput.setAttr("title", `Set color for ${g.name}`);
      colorInput.onchange = () => {
        this.settings.timelineColors[g.name] = colorInput.value;
        void this.persist();
      };
      colorInput.onclick = (e) => e.stopPropagation();

      top.createSpan({ cls: "timelinex-timeline-name", text: g.name });
      top.createSpan({ cls: "timelinex-count-badge", text: String(g.events.length) });

      const solo = top.createSpan({
        cls:
          "timelinex-solo-icon" + (this.soloTimeline === g.name ? " is-active" : ""),
      });
      setIcon(solo, "crosshair");
      solo.setAttr(
        "title",
        this.soloTimeline === g.name ? "Back to overlay view" : "Solo view"
      );
      solo.onclick = () => {
        this.soloTimeline = this.soloTimeline === g.name ? null : g.name;
        this.render();
      };

      const eye = top.createSpan({ cls: "timelinex-eye-btn" });
      setIcon(eye, g.visible ? "eye" : "eye-off");
      eye.setAttr("title", g.visible ? "Hide timeline" : "Show timeline");
      eye.onclick = () => {
        if (g.visible) {
          this.settings.hiddenTimelines.push(g.name);
        } else {
          this.settings.hiddenTimelines = this.settings.hiddenTimelines.filter(
            (n) => n !== g.name
          );
        }
        void this.persist();
      };

      const more = top.createSpan({ cls: "timelinex-more-btn" });
      setIcon(more, "more-vertical");
      more.setAttr("title", "Timeline actions");
      more.onclick = (e) => this.openTimelineActionsMenu(e, g, groups);
    }

    // Footer stats
    const allEvents = this.index.getAllEvents();
    const visibleCount = groups
      .filter((g) => g.visible)
      .reduce((sum, g) => sum + g.events.length, 0);
    const footer = sidebar.createDiv({ cls: "timelinex-sidebar-footer" });
    const row1 = footer.createDiv({ cls: "timelinex-stat-row" });
    row1.createSpan({ text: "Dated events" });
    row1.createSpan({ text: String(allEvents.length) });
    const row2 = footer.createDiv({ cls: "timelinex-stat-row" });
    row2.createSpan({ text: "Visible" });
    row2.createSpan({ text: String(visibleCount) });

    const missingTimeline = this.index.getOrphansMissingTimeline();
    const missingDate = this.index.getOrphansMissingDate();
    if (missingTimeline.length > 0) {
      const hint = footer.createDiv({ cls: "timelinex-orphan-hint" });
      hint.setText(
        `${missingTimeline.length} note${missingTimeline.length === 1 ? "" : "s"} have a date but no timeline`
      );
      hint.onclick = () =>
        new OrphanListModal(this.app, "Notes missing a timeline", missingTimeline, (path) =>
          this.openFileByPath(path)
        ).open();
    }
    if (missingDate.length > 0) {
      const hint = footer.createDiv({ cls: "timelinex-orphan-hint" });
      hint.setText(
        `${missingDate.length} note${missingDate.length === 1 ? "" : "s"} have a timeline but no date`
      );
      hint.onclick = () =>
        new OrphanListModal(this.app, "Notes missing a date", missingDate, (path) =>
          this.openFileByPath(path)
        ).open();
    }
  }

  private openFileByPath(path: string): void {
    const file = this.index.getFile(path);
    if (file) this.app.workspace.getLeaf(false).openFile(file);
  }

  private openTimelineActionsMenu(
    e: MouseEvent,
    group: TimelineGroup,
    allGroups: TimelineGroup[]
  ): void {
    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle("Rename timeline…")
        .setIcon("pencil")
        .onClick(() => {
          new RenameTimelineModal(this.app, group.name, async (newName) => {
            await this.index.renameTimelineAcrossNotes(group.name, newName);
            this.renameInSettings(group.name, newName);
            await this.persist();
          }).open();
        })
    );

    const otherNames = allGroups.map((g) => g.name).filter((n) => n !== group.name);
    menu.addItem((item) =>
      item
        .setTitle("Merge into…")
        .setIcon("merge")
        .onClick(() => {
          if (otherNames.length === 0) {
            new Notice("There are no other timelines to merge into.");
            return;
          }
          new MergeTimelineModal(this.app, group.name, otherNames, async (target) => {
            await this.index.mergeTimelineAcrossNotes(group.name, target);
            this.removeFromSettings(group.name);
            if (this.soloTimeline === group.name) this.soloTimeline = target;
            await this.persist();
          }).open();
        })
    );

    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle("Delete timeline (keep notes)")
        .setIcon("trash")
        .onClick(() => {
          new ConfirmModal(
            this.app,
            `Remove the "${group.name}" timeline property from all ${group.events.length} of its notes? Their dates are kept -- they'll just be ungrouped, and will show up under "missing a timeline" until reassigned.`,
            "Remove",
            async () => {
              await this.index.clearTimelineAcrossNotes(group.name);
              this.removeFromSettings(group.name);
              if (this.soloTimeline === group.name) this.soloTimeline = null;
              await this.persist();
            }
          ).open();
        })
    );

    menu.showAtMouseEvent(e);
  }

  private renameInSettings(oldName: string, newName: string): void {
    if (this.settings.timelineColors[oldName] !== undefined) {
      this.settings.timelineColors[newName] = this.settings.timelineColors[oldName];
      delete this.settings.timelineColors[oldName];
    }
    this.settings.timelineOrder = this.settings.timelineOrder.map((n) =>
      n === oldName ? newName : n
    );
    this.settings.hiddenTimelines = this.settings.hiddenTimelines.map((n) =>
      n === oldName ? newName : n
    );
    if (this.soloTimeline === oldName) this.soloTimeline = newName;
  }

  private removeFromSettings(name: string): void {
    delete this.settings.timelineColors[name];
    this.settings.timelineOrder = this.settings.timelineOrder.filter((n) => n !== name);
    this.settings.hiddenTimelines = this.settings.hiddenTimelines.filter((n) => n !== name);
  }

  // ---------------- Main timeline ----------------

  /**
   * Per spec: a timeline's length is "smart" -- it spans from 1 year before
   * its earliest note's date to 1 year after its latest note's date/end
   * date. For the master overlay this is the union across visible timelines.
   */
  private computeDomain(
    events: TimeLineXEvent[],
    today: number
  ): { dataMin: number; dataMax: number; totalYears: number } {
    let dataMin: number;
    let dataMax: number;
    if (events.length === 0) {
      dataMin = today - 10;
      dataMax = today + 10;
    } else {
      dataMin = Math.min(...events.map((e) => e.startYear)) - 1;
      dataMax = Math.max(...events.map((e) => e.endYear)) + 1;
    }
    const totalYears = Math.max(dataMax - dataMin, MIN_YEARS_VISIBLE * 2);
    return { dataMin, dataMax, totalYears };
  }

  /**
   * Generates axis ticks at whatever granularity currently fits: days,
   * weeks, or months when zoomed in; plain years in the middle; and
   * decade/century/millennium-style groupings (with BC/AD) when zoomed out.
   *
   * `originYear` anchors pixel position (always the canvas's true start, so
   * ticks land in the right place on the full scrollable width). `rangeMin`
   * /`rangeMax` are what we actually iterate over -- normally just the
   * visible viewport (plus a little buffer), NOT the whole dataset. That
   * distinction matters: without it, a day-level tick loop over a
   * 100+ year dataset would need tens of thousands of ticks and always get
   * rejected in favor of a coarser unit, even while fully zoomed in on a
   * single week.
   */
  private computeTicks(
    originYear: number,
    rangeMin: number,
    rangeMax: number,
    pixelsPerYear: number
  ): { left: number; label: string }[] {
    const visibleSpanYears = Math.max(rangeMax - rangeMin, 1e-6);
    const unit = pickTickUnit(pixelsPerYear, visibleSpanYears);
    const cal = this.settings.displayCalendar;
    const ticks: { left: number; label: string }[] = [];

    if (unit.kind === "year") {
      const firstTick = Math.ceil(rangeMin / unit.years) * unit.years;
      for (let y = firstTick; y <= rangeMax; y += unit.years) {
        const left = (y - originYear) * pixelsPerYear;
        const displayYear = fromGregorian(cal, { y: Math.round(y), m: 1, d: 1 }).y;
        ticks.push({ left, label: formatYearTickLabel(displayYear, unit.years) });
      }
      return ticks;
    }

    if (unit.kind === "month" || unit.kind === "quarter") {
      const startLocal = fromGregorian(cal, decimalYearToGregorian(rangeMin));
      let y = startLocal.y;
      let m = startLocal.m;
      const step = unit.kind === "quarter" ? 3 : 1;
      if (unit.kind === "quarter") m = Math.floor((m - 1) / 3) * 3 + 1;

      // Safety cap in case of any edge-case runaway loop.
      for (let i = 0; i < 2000; i++) {
        const jdn = monthStartJdn(cal, y, m);
        const posYear = decimalYearFromGregorian(jdnToGregorian(jdn));
        if (posYear > rangeMax) break;
        if (posYear >= rangeMin) {
          const left = (posYear - originYear) * pixelsPerYear;
          const label =
            unit.kind === "quarter"
              ? `Q${Math.ceil(m / 3)} ${y}`
              : `${CALENDAR_MONTH_NAMES[cal][m - 1]} ${y}`;
          ticks.push({ left, label });
        }
        m += step;
        while (m > 12) {
          m -= 12;
          y += 1;
        }
      }
      return ticks;
    }

    // day / week: iterate by whole days using the Julian Day Number, which
    // is calendar-agnostic, then format the label in the display calendar.
    const stepDays = unit.kind === "week" ? 7 : 1;
    const startGregorian = decimalYearToGregorian(rangeMin);
    let jdn = gregorianToJdn(startGregorian.y, startGregorian.m, startGregorian.d);
    jdn = Math.ceil(jdn / stepDays) * stepDays;

    for (let i = 0; i < 3000; i++) {
      const g = jdnToGregorian(jdn);
      const posYear = decimalYearFromGregorian(g);
      if (posYear > rangeMax) break;
      const local = fromGregorian(cal, g);
      const left = (posYear - originYear) * pixelsPerYear;
      const label = `${local.d} ${CALENDAR_MONTH_NAMES[cal][local.m - 1]} ${local.y}`;
      ticks.push({ left, label });
      jdn += stepDays;
    }
    return ticks;
  }

  private renderMain(main: HTMLElement, groups: TimelineGroup[]): void {
    main.empty();
    const visibleGroups = this.soloTimeline
      ? groups.filter((g) => g.name === this.soloTimeline)
      : groups.filter((g) => g.visible);

    const allVisibleEvents = visibleGroups.flatMap((g) => g.events);
    const today = todayDecimalYear();
    const { dataMin, dataMax, totalYears } = this.computeDomain(allVisibleEvents, today);

    const header = main.createDiv({ cls: "timelinex-main-header" });
    const titleBlock = header.createDiv();
    titleBlock.createDiv({
      cls: "timelinex-main-title",
      text: this.soloTimeline
        ? `${this.soloTimeline} — Solo`
        : "All Timelines — Overlay",
    });
    titleBlock.createDiv({
      cls: "timelinex-main-subtitle",
      text: `${allVisibleEvents.length} events across ${visibleGroups.length} timeline${
        visibleGroups.length === 1 ? "" : "s"
      }`,
    });

    const toolbar = header.createDiv({ cls: "timelinex-toolbar" });

    // Calendar dropdown (full names)
    const calWrap = toolbar.createDiv({ cls: "timelinex-toolbar-group" });
    calWrap.createSpan({ cls: "timelinex-toolbar-label", text: "Calendar" });
    const calSelect = calWrap.createEl("select", { cls: "dropdown timelinex-calendar-select" });
    (Object.keys(CALENDAR_FULL_NAMES) as CalendarSystem[]).forEach((cal) => {
      const opt = calSelect.createEl("option", {
        text: CALENDAR_FULL_NAMES[cal],
        value: cal,
      });
      if (cal === this.settings.displayCalendar) opt.selected = true;
    });
    calSelect.onchange = () => {
      this.settings.displayCalendar = calSelect.value as CalendarSystem;
      void this.persist();
    };

    // Zoom preset dropdown
    const zoomWrap = toolbar.createDiv({ cls: "timelinex-toolbar-group" });
    zoomWrap.createSpan({ cls: "timelinex-toolbar-label", text: "Zoom" });
    const zoomSelect = zoomWrap.createEl("select", { cls: "dropdown timelinex-zoom-select" });
    const allOption = zoomSelect.createEl("option", { text: "All (fit)", value: "all" });
    const presetYears: number[] = [totalYears];
    for (const level of ZOOM_LEVELS) {
      zoomSelect.createEl("option", { text: level.label, value: level.id });
      presetYears.push(level.yearsVisible);
    }
    // Highlight whichever preset is closest to the current continuous zoom.
    const currentYearsVisible = yearsVisibleForPercent(this.zoomPercent, totalYears);
    let closestId = "all";
    let closestDist = Math.abs(Math.log(currentYearsVisible / totalYears));
    for (const level of ZOOM_LEVELS) {
      const dist = Math.abs(Math.log(currentYearsVisible / level.yearsVisible));
      if (dist < closestDist) {
        closestDist = dist;
        closestId = level.id;
      }
    }
    zoomSelect.value = closestId;
    allOption.selected = closestId === "all";
    zoomSelect.onchange = () => {
      const value = zoomSelect.value;
      const targetYears =
        value === "all"
          ? totalYears
          : ZOOM_LEVELS.find((l) => l.id === value)?.yearsVisible ?? totalYears;
      this.zoomPercent = percentForYearsVisible(targetYears, totalYears);
      this.render();
    };

    // Zoom slider (0% = whole timeline, 100% = ~7 days). Declared before use
    // below so the "scrollContainer" variable it closes over can be assigned
    // after the toolbar is built, further down.
    let scrollContainer: HTMLElement;

    const sliderWrap = toolbar.createDiv({ cls: "timelinex-toolbar-group timelinex-slider-group" });
    sliderWrap.createSpan({ cls: "timelinex-toolbar-label", text: "0%" });
    const slider = sliderWrap.createEl("input", { cls: "timelinex-zoom-slider" });
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "0.5";
    slider.value = String(this.zoomPercent);
    sliderWrap.createSpan({ cls: "timelinex-toolbar-label", text: "100%" });
    const pctLabel = sliderWrap.createSpan({
      cls: "timelinex-zoom-pct",
      text: `${Math.round(this.zoomPercent)}%`,
    });
    // Re-render only the canvas while dragging, so the slider's own DOM node
    // is never torn down mid-drag (that would break native slider dragging).
    slider.oninput = () => {
      this.zoomPercent = parseFloat(slider.value);
      pctLabel.setText(`${Math.round(this.zoomPercent)}%`);
      scrollContainer.empty();
      this.renderTimelineCanvas(
        scrollContainer,
        visibleGroups,
        allVisibleEvents,
        dataMin,
        dataMax,
        totalYears
      );
    };
    // Once the drag ends, do a full render so the zoom preset dropdown's
    // "closest match" highlighting catches up.
    slider.onchange = () => {
      this.render();
    };

    scrollContainer = main.createDiv({ cls: "timelinex-scroll-container" });
    this.renderTimelineCanvas(scrollContainer, visibleGroups, allVisibleEvents, dataMin, dataMax, totalYears);
  }

  private renderTimelineCanvas(
    container: HTMLElement,
    groups: TimelineGroup[],
    events: TimeLineXEvent[],
    dataMin: number,
    dataMax: number,
    totalYears: number
  ): void {
    // The zoom slider re-invokes this on the *same* container repeatedly (to
    // avoid tearing down the slider's own DOM node mid-drag), so listeners
    // from any previous call need to be torn down first or they'd pile up.
    const prevController = (container as unknown as { _timelinexAbort?: AbortController })
      ._timelinexAbort;
    if (prevController) prevController.abort();
    const abortController = new AbortController();
    (container as unknown as { _timelinexAbort?: AbortController })._timelinexAbort =
      abortController;
    const { signal } = abortController;

    const today = todayDecimalYear();
    const viewportWidth = Math.max(container.clientWidth, 800);
    const yearsVisible = yearsVisibleForPercent(this.zoomPercent, totalYears);
    let pixelsPerYear = viewportWidth / yearsVisible;

    // Guard against pathologically wide content at extreme zoom levels.
    const maxPxPerYear = MAX_CONTENT_PX / totalYears;
    pixelsPerYear = Math.min(pixelsPerYear, maxPxPerYear);

    this.lastDataMin = dataMin;
    this.lastPixelsPerYear = pixelsPerYear;

    const contentWidth = totalYears * pixelsPerYear;

    const canvas = container.createDiv({ cls: "timelinex-canvas" });
    canvas.style.width = `${contentWidth}px`;

    // Axis. Ticks are virtualized to the visible (scrolled) window rather
    // than the whole dataMin..dataMax span -- otherwise a day-level zoom on
    // a long-lived timeline would need tens of thousands of tick elements.
    const axis = canvas.createDiv({ cls: "timelinex-axis" });
    const renderVisibleTicks = () => {
      axis.empty();
      const viewportYears = viewportWidth / pixelsPerYear;
      const scrollYears = container.scrollLeft / pixelsPerYear;
      const rangeMin = Math.max(dataMin, dataMin + scrollYears - viewportYears * 0.25);
      const rangeMax = Math.min(dataMax, dataMin + scrollYears + viewportYears * 1.25);
      const ticks = this.computeTicks(dataMin, rangeMin, rangeMax, pixelsPerYear);
      for (const t of ticks) {
        const tick = axis.createDiv({ cls: "timelinex-tick" });
        tick.style.left = `${t.left}px`;
        tick.createSpan({ text: t.label });
      }
    };
    renderVisibleTicks();
    let scrollTickRaf: number | null = null;
    container.addEventListener(
      "scroll",
      () => {
        if (scrollTickRaf !== null) return;
        scrollTickRaf = requestAnimationFrame(() => {
          scrollTickRaf = null;
          renderVisibleTicks();
        });
      },
      { signal }
    );

    // Today marker
    if (today >= dataMin && today <= dataMax) {
      const todayLeft = (today - dataMin) * pixelsPerYear;
      const line = canvas.createDiv({ cls: "timelinex-today-line" });
      line.style.left = `${todayLeft}px`;
      const label = canvas.createDiv({ cls: "timelinex-today-label" });
      label.style.left = `${todayLeft}px`;
      label.setText("Today");
    }

    // Tracks
    const tracksEl = canvas.createDiv({ cls: "timelinex-tracks" });
    const minGapYears = 12 / pixelsPerYear;

    for (const group of groups) {
      const laneMap = assignLanes(group.events, minGapYears);
      const laneCount = Math.max(1, ...Array.from(laneMap.values()).map((l) => l + 1));
      const rowHeight = 40 + (laneCount - 1) * 26;

      const track = tracksEl.createDiv({ cls: "timelinex-track" });
      track.style.height = `${rowHeight}px`;
      track.style.backgroundColor = `${group.color}1a`;

      const label = track.createDiv({ cls: "timelinex-track-label" });
      const dot = label.createSpan({ cls: "timelinex-dot" });
      dot.style.backgroundColor = group.color;
      label.createSpan({ text: group.name, cls: "timelinex-track-label-text" });
      label.style.color = group.color;
      track.setAttr("title", `Double-click to add a new note to "${group.name}"`);

      track.addEventListener("dblclick", (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest(".timelinex-pill")) return;
        const trackRect = track.getBoundingClientRect();
        const clickX = e.clientX - trackRect.left;
        const clickYear = dataMin + clickX / pixelsPerYear;
        this.openNewEventModal(group.name, clickYear);
      });

      for (const ev of group.events) {
        const lane = laneMap.get(ev) ?? 0;
        const left = (ev.startYear - dataMin) * pixelsPerYear;
        const minWidth = ev.isRange ? 24 : 14;
        const width = Math.max(minWidth, (ev.endYear - ev.startYear) * pixelsPerYear);

        const pill = track.createDiv({
          cls: "timelinex-pill" + (ev.isRange ? "" : " is-point"),
        });
        pill.style.left = `${left}px`;
        pill.style.width = `${width}px`;
        pill.style.top = `${8 + lane * 26}px`;
        pill.style.backgroundColor = group.color;
        pill.setText(ev.title);
        pill.setAttr(
          "title",
          `${ev.title}\n${group.name}\n${this.formatEventRange(ev)}\n(drag to move, edges to resize)`
        );

        this.attachPillInteractions(pill, ev, pixelsPerYear, dataMin, minWidth);
      }
    }

    // ---- Mouse-wheel zoom (like Photoshop: wheel = zoom, Shift+wheel = pan) ----
    container.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        if (e.shiftKey) {
          container.scrollLeft += e.deltaY;
          return;
        }
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left + container.scrollLeft;
        const yearUnderCursor = this.lastDataMin + cursorX / this.lastPixelsPerYear;

        const step = e.deltaY > 0 ? -4 : 4;
        this.zoomPercent = Math.min(100, Math.max(0, this.zoomPercent + step));
        this.render();

        const newContainer = this.containerEl.querySelector(
          ".timelinex-scroll-container"
        ) as HTMLElement | null;
        if (newContainer) {
          const newScrollLeft =
            (yearUnderCursor - this.lastDataMin) * this.lastPixelsPerYear - cursorX;
          newContainer.scrollLeft = Math.max(0, newScrollLeft);
        }
      },
      { passive: false, signal }
    );
  }

  /**
   * Wires up drag-to-move and drag-edges-to-resize on an event pill, writing
   * the new date(s) back to the note's frontmatter on mouse release.
   */
  private attachPillInteractions(
    pill: HTMLElement,
    ev: TimeLineXEvent,
    pixelsPerYear: number,
    dataMin: number,
    minWidth: number
  ): void {
    let mode: "move" | "resize-start" | "resize-end" | null = null;
    let startClientX = 0;
    let originStart = ev.startYear;
    let originEnd = ev.endYear;
    let pendingStart = ev.startYear;
    let pendingEnd = ev.endYear;
    let moved = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!mode) return;
      const deltaYears = (e.clientX - startClientX) / pixelsPerYear;
      if (Math.abs(e.clientX - startClientX) > 3) moved = true;

      if (mode === "move") {
        pendingStart = originStart + deltaYears;
        pendingEnd = originEnd + deltaYears;
      } else if (mode === "resize-start") {
        pendingStart = Math.min(originStart + deltaYears, originEnd - MIN_EVENT_SPAN_YEARS);
        pendingEnd = originEnd;
      } else if (mode === "resize-end") {
        pendingEnd = Math.max(originEnd + deltaYears, originStart + MIN_EVENT_SPAN_YEARS);
        pendingStart = originStart;
      }

      pill.style.left = `${(pendingStart - dataMin) * pixelsPerYear}px`;
      pill.style.width = `${Math.max(minWidth, (pendingEnd - pendingStart) * pixelsPerYear)}px`;
      pill.addClass("is-dragging");
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      pill.removeClass("is-dragging");
      if (mode && moved) {
        if (this.settings.confirmDragEdits) {
          this.showDragConfirmation(pill, ev, pendingStart, pendingEnd);
        } else {
          void this.commitEventDatesWithUndo(ev, pendingStart, pendingEnd);
        }
      }
      mode = null;
    };

    const startDrag = (nextMode: typeof mode) => (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      mode = nextMode;
      startClientX = e.clientX;
      originStart = ev.startYear;
      originEnd = ev.endYear;
      pendingStart = ev.startYear;
      pendingEnd = ev.endYear;
      moved = false;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    pill.onmousedown = startDrag("move");
    pill.onclick = () => {
      if (moved) return; // just finished a drag, don't also open the note
      const file = this.index.getFile(ev.filePath);
      if (file) this.app.workspace.getLeaf(false).openFile(file);
    };

    if (ev.isRange) {
      const leftHandle = pill.createDiv({ cls: "timelinex-resize-handle is-left" });
      leftHandle.onmousedown = startDrag("resize-start");
      const rightHandle = pill.createDiv({ cls: "timelinex-resize-handle is-right" });
      rightHandle.onmousedown = startDrag("resize-end");
    }
  }

  private async commitEventDates(
    ev: TimeLineXEvent,
    newStartYear: number,
    newEndYear: number
  ): Promise<void> {
    const file = this.index.getFile(ev.filePath);
    if (!file) return;
    const startGregorian = decimalYearToGregorian(newStartYear);
    const startLocal = fromGregorian(ev.sourceCalendar, startGregorian);

    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm[this.settings.dateKey] = toFrontmatterDateString(startLocal);
      if (ev.isRange) {
        const endGregorian = decimalYearToGregorian(newEndYear);
        const endLocal = fromGregorian(ev.sourceCalendar, endGregorian);
        fm[this.settings.dateEndKey] = toFrontmatterDateString(endLocal);
      }
    });
  }

  /**
   * Shows a small floating Save/Cancel bar next to a just-dragged pill (used
   * when settings.confirmDragEdits is on). Canceling re-renders to snap the
   * pill back to its original position.
   */
  private showDragConfirmation(
    pill: HTMLElement,
    ev: TimeLineXEvent,
    newStart: number,
    newEnd: number
  ): void {
    const rect = pill.getBoundingClientRect();
    const bar = document.body.createDiv({ cls: "timelinex-drag-confirm" });
    bar.style.left = `${Math.max(4, rect.left)}px`;
    bar.style.top = `${rect.bottom + 6}px`;
    bar.createSpan({
      text: `Move "${ev.title}" to ${this.formatEventRangeFor(newStart, newEnd, ev.isRange)}?`,
    });
    const actions = bar.createDiv({ cls: "timelinex-drag-confirm-actions" });
    const saveBtn = actions.createEl("button", { text: "Save", cls: "mod-cta" });
    const cancelBtn = actions.createEl("button", { text: "Cancel" });

    let settled = false;
    const cleanup = () => {
      bar.remove();
      document.removeEventListener("mousedown", onOutsideClick, true);
    };
    const onOutsideClick = (e: MouseEvent) => {
      if (settled) return;
      if (!bar.contains(e.target as Node)) {
        settled = true;
        cleanup();
        this.render(); // snap the pill back to its pre-drag position
      }
    };

    saveBtn.onclick = () => {
      settled = true;
      cleanup();
      void this.commitEventDatesWithUndo(ev, newStart, newEnd);
    };
    cancelBtn.onclick = () => {
      settled = true;
      cleanup();
      this.render();
    };
    // Deferred so the mouseup that ended the drag doesn't immediately count
    // as an "outside click".
    setTimeout(() => document.addEventListener("mousedown", onOutsideClick, true), 0);
  }

  /** Writes the new date(s) to frontmatter, then offers a quick Undo toast. */
  private async commitEventDatesWithUndo(
    ev: TimeLineXEvent,
    newStartYear: number,
    newEndYear: number
  ): Promise<void> {
    const prevStart = ev.startYear;
    const prevEnd = ev.endYear;
    await this.commitEventDates(ev, newStartYear, newEndYear);

    const frag = document.createDocumentFragment();
    frag.createSpan({
      text: `Updated "${ev.title}" to ${this.formatEventRangeFor(newStartYear, newEndYear, ev.isRange)}. `,
    });
    const undoLink = frag.createEl("a", { text: "Undo", cls: "timelinex-undo-link" });
    const notice = new Notice(frag, 8000);
    undoLink.onclick = () => {
      void this.commitEventDates(ev, prevStart, prevEnd);
      notice.hide();
    };
  }

  private formatEventRangeFor(start: number, end: number, isRange: boolean): string {
    const s = Math.round(start);
    const e = Math.round(end);
    return isRange ? `${s} – ${e}` : `${s}`;
  }

  // ---------------- Creating notes from the timeline ----------------

  private openNewEventModal(timelineName: string, clickYear: number): void {
    const gregorian = decimalYearToGregorian(clickYear);
    const localDate = fromGregorian(this.settings.displayCalendar, gregorian);
    const defaultDateStr = toFrontmatterDateString(localDate);
    new NewEventModal(
      this.app,
      defaultDateStr,
      timelineName,
      this.settings.displayCalendar,
      (data) => void this.createNoteFromModal(data)
    ).open();
  }

  private async createNoteFromModal(data: NewEventData): Promise<void> {
    const sanitized = data.title.replace(/[\\/:*?"<>|]/g, "").trim() || "Untitled";
    let path = `${sanitized}.md`;
    let counter = 1;
    while (this.app.vault.getAbstractFileByPath(path)) {
      counter += 1;
      path = `${sanitized} (${counter}).md`;
    }

    const fmLines: string[] = [`${this.settings.dateKey}: ${data.date}`];
    if (data.dateEnd) fmLines.push(`${this.settings.dateEndKey}: ${data.dateEnd}`);
    fmLines.push(`${this.settings.timelineKey}: ${data.timeline}`);
    if (data.calendar !== "gregorian") {
      fmLines.push(`${this.settings.calendarKey}: ${data.calendar}`);
    }
    const content = `---\n${fmLines.join("\n")}\n---\n\n# ${data.title}\n`;

    const file = await this.app.vault.create(path, content);
    await this.app.workspace.getLeaf(false).openFile(file);
  }

  private formatEventRange(ev: TimeLineXEvent): string {
    const startLabel = Math.round(ev.startYear);
    const endLabel = Math.round(ev.endYear);
    return ev.isRange ? `${startLabel} – ${endLabel}` : `${startLabel}`;
  }
}
