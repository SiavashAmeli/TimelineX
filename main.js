/* TimeLineX for Obsidian - bundled */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TimeLineXPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/timelineIndex.ts
var import_obsidian = require("obsidian");

// src/calendars.ts
function div(a, b) {
  return ~~(a / b);
}
function mod(a, b) {
  return a - ~~(a / b) * b;
}
function gregorianToJdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}
function jdnToGregorian(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d2 / 4);
  const m2 = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m2 + 2) / 5) + 1;
  const month = m2 + 3 - 12 * Math.floor(m2 / 10);
  const year = 100 * b + d2 - 4800 + Math.floor(m2 / 10);
  return { y: year, m: month, d: day };
}
var JALALI_BREAKS = [
  -61,
  9,
  38,
  199,
  426,
  686,
  756,
  818,
  1111,
  1181,
  1210,
  1635,
  2060,
  2097,
  2192,
  2262,
  2324,
  2394,
  2456,
  3178
];
function jalCal(jy) {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  if (jy < jp || jy >= JALALI_BREAKS[bl - 1]) {
    const approxMarch = 21;
    return { leap: jy % 4 === 3 ? 1 : 0, gy, march: approxMarch };
  }
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}
function jalaliToJdn(jy, jm, jd) {
  const r = jalCal(jy);
  return gregorianToJdn(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}
function jdnToJalali(jdn) {
  const gy = jdnToGregorian(jdn).y;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = gregorianToJdn(r.gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm;
  let jd;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { y: jy, m: jm, d: jd };
    } else {
      k -= 186;
    }
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { y: jy, m: jm, d: jd };
}
var ISLAMIC_EPOCH = 1948440;
function islamicToJdn(hy, hm, hd) {
  return hd + Math.ceil(29.5 * (hm - 1)) + (hy - 1) * 354 + Math.floor((3 + 11 * hy) / 30) + ISLAMIC_EPOCH - 1;
}
function jdnToIslamic(jdn) {
  let n = Math.floor(jdn) - ISLAMIC_EPOCH + 10632;
  const cycles = Math.floor((n - 1) / 10631);
  n = n - 10631 * cycles + 354;
  const j = Math.floor((10985 - n) / 5316) * Math.floor(50 * n / 17719) + Math.floor(n / 5670) * Math.floor(43 * n / 15238);
  n = n - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) - Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
  const m = Math.floor(24 * n / 709);
  const d = n - Math.floor(709 * m / 24);
  const y = 30 * cycles + j - 30;
  return { y, m: m + 1, d };
}
function toGregorian(cal, dt) {
  if (cal === "gregorian") return dt;
  const jdn = cal === "persian" ? jalaliToJdn(dt.y, dt.m, dt.d) : islamicToJdn(dt.y, dt.m, dt.d);
  return jdnToGregorian(jdn);
}
function fromGregorian(cal, g) {
  if (cal === "gregorian") return g;
  const jdn = gregorianToJdn(g.y, g.m, g.d);
  return cal === "persian" ? jdnToJalali(jdn) : jdnToIslamic(jdn);
}
var GREG_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isLeapGregorian(y) {
  return y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;
}
function decimalYearFromGregorian(g) {
  let days = g.d;
  for (let i = 0; i < g.m - 1; i++) {
    days += GREG_MONTH_DAYS[i];
    if (i === 1 && isLeapGregorian(g.y)) days += 1;
  }
  const totalDays = isLeapGregorian(g.y) ? 366 : 365;
  return g.y + (days - 1) / totalDays;
}
function decimalYearToGregorian(dec) {
  const jdn = gregorianToJdn(Math.floor(dec), 1, 1);
  const frac = dec - Math.floor(dec);
  const totalDays = isLeapGregorian(Math.floor(dec)) ? 366 : 365;
  return jdnToGregorian(jdn + Math.round(frac * totalDays));
}
var CALENDAR_FULL_NAMES = {
  gregorian: "Gregorian",
  persian: "Hijri Shamsi",
  hijri: "Hijri Qamari"
};
var CALENDAR_MONTH_NAMES = {
  gregorian: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  persian: [
    "Farvardin",
    "Ordibehesht",
    "Khordad",
    "Tir",
    "Mordad",
    "Shahrivar",
    "Mehr",
    "Aban",
    "Azar",
    "Dey",
    "Bahman",
    "Esfand"
  ],
  hijri: [
    "Muharram",
    "Safar",
    "Rabi I",
    "Rabi II",
    "Jumada I",
    "Jumada II",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qi'dah",
    "Dhu al-Hijjah"
  ]
};
function toFrontmatterDateString(dt) {
  const pad = (n) => String(Math.max(1, Math.min(99, n))).padStart(2, "0");
  return `${dt.y}-${pad(dt.m)}-${pad(dt.d)}`;
}
function monthStartJdn(cal, y, m) {
  if (cal === "gregorian") return gregorianToJdn(y, m, 1);
  if (cal === "persian") return jalaliToJdn(y, m, 1);
  return islamicToJdn(y, m, 1);
}
function parseFlexibleDate(raw) {
  if (raw === void 0 || raw === null || raw === "") return null;
  if (typeof raw === "number" && !isNaN(raw)) {
    return { y: raw, m: 1, d: 1 };
  }
  const s = String(raw).trim();
  const match = s.match(/^(-?\d{1,6})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 1;
  const d = match[3] ? parseInt(match[3], 10) : 1;
  return { y, m: Math.min(Math.max(m, 1), 12), d: Math.min(Math.max(d, 1), 31) };
}

// src/types.ts
var ZOOM_LEVELS = [
  { id: "1000yr", label: "1000 yr", yearsVisible: 1e3 },
  { id: "100yr", label: "100 yr", yearsVisible: 100 },
  { id: "10yr", label: "10 yr", yearsVisible: 10 },
  { id: "1yr", label: "1 yr", yearsVisible: 1 },
  { id: "quarter", label: "Quarter", yearsVisible: 0.25 },
  { id: "month", label: "Month", yearsVisible: 1 / 12 },
  { id: "week", label: "Week", yearsVisible: 7 / 365 },
  { id: "day", label: "Day", yearsVisible: 1 / 365 }
];
var TIMELINE_PALETTE = [
  "#8b5cf6",
  // purple
  "#ef4444",
  // red
  "#f59e0b",
  // amber
  "#10b981",
  // green/teal
  "#6366f1",
  // indigo
  "#ec4899",
  // pink
  "#06b6d4",
  // cyan
  "#eab308",
  // yellow
  "#84cc16",
  // lime
  "#f97316"
  // orange
];

// src/timelineIndex.ts
var TimeLineXIndex = class extends import_obsidian.Component {
  constructor(app, settings) {
    super();
    this.app = app;
    this.settings = settings;
    this.events = [];
    this.missingTimeline = [];
    this.missingDate = [];
    this.listeners = [];
  }
  onload() {
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
  onExternalChange(cb) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }
  notify() {
    for (const l of this.listeners) l();
  }
  rebuild() {
    var _a;
    const events = [];
    const missingTimeline = [];
    const missingDate = [];
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache == null ? void 0 : cache.frontmatter;
      if (!fm) continue;
      const rawDate = fm[this.settings.dateKey];
      const rawTimeline = fm[this.settings.timelineKey];
      const hasDate = rawDate !== void 0 && rawDate !== null && rawDate !== "";
      const hasTimeline = typeof rawTimeline === "string" && rawTimeline.trim() !== "";
      if (!hasDate && !hasTimeline) continue;
      if (hasDate && !hasTimeline) {
        missingTimeline.push({ filePath: file.path, title: file.basename });
        continue;
      }
      if (!hasDate && hasTimeline) {
        missingDate.push({ filePath: file.path, title: file.basename });
        continue;
      }
      const timeline = rawTimeline;
      const sourceCalendar = fm[this.settings.calendarKey] || "gregorian";
      const start = parseFlexibleDate(rawDate);
      if (!start) continue;
      const rawEnd = fm[this.settings.dateEndKey];
      const end = (_a = parseFlexibleDate(rawEnd)) != null ? _a : start;
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
        sourceCalendar
      });
    }
    events.sort((a, b) => a.startYear - b.startYear);
    this.events = events;
    this.missingTimeline = missingTimeline;
    this.missingDate = missingDate;
    this.notify();
  }
  getAllEvents() {
    return this.events;
  }
  getOrphansMissingTimeline() {
    return this.missingTimeline;
  }
  getOrphansMissingDate() {
    return this.missingDate;
  }
  getTimelineGroups() {
    const names = [];
    for (const e of this.events) {
      if (!names.includes(e.timeline)) names.push(e.timeline);
    }
    const known = this.settings.timelineOrder.filter((n) => names.includes(n));
    const fresh = names.filter((n) => !known.includes(n));
    const order = [...known, ...fresh];
    this.settings.timelineOrder = order;
    return order.map((name, i) => {
      if (!this.settings.timelineColors[name]) {
        this.settings.timelineColors[name] = TIMELINE_PALETTE[i % TIMELINE_PALETTE.length];
      }
      return {
        name,
        color: this.settings.timelineColors[name],
        visible: !this.settings.hiddenTimelines.includes(name),
        events: this.events.filter((e) => e.timeline === name)
      };
    });
  }
  getFile(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    return f instanceof import_obsidian.TFile ? f : null;
  }
  /** Renames a timeline across every note that belongs to it. */
  async renameTimelineAcrossNotes(oldName, newName) {
    if (oldName === newName || !newName.trim()) return;
    const paths = this.events.filter((e) => e.timeline === oldName).map((e) => e.filePath);
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
  async mergeTimelineAcrossNotes(sourceName, targetName) {
    await this.renameTimelineAcrossNotes(sourceName, targetName);
  }
  /**
   * Removes the timeline property from every note that has it, ungrouping
   * them. Their date/date_end properties are left untouched, so they'll show
   * up in the "missing timeline" hint afterwards rather than disappearing.
   */
  async clearTimelineAcrossNotes(name) {
    const paths = this.events.filter((e) => e.timeline === name).map((e) => e.filePath);
    for (const path of paths) {
      const file = this.getFile(path);
      if (!file) continue;
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        delete fm[this.settings.timelineKey];
      });
    }
    this.rebuild();
  }
};

// src/settingsTab.ts
var import_obsidian2 = require("obsidian");
var TimeLineXSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("TimeLineX").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Display calendar").setDesc(
      "Calendar used to label years and dates on the timeline. This only affects display \u2014 your notes' frontmatter is untouched."
    ).addDropdown(
      (dd) => dd.addOption("gregorian", CALENDAR_FULL_NAMES.gregorian).addOption("persian", CALENDAR_FULL_NAMES.persian).addOption("hijri", CALENDAR_FULL_NAMES.hijri).setValue(this.plugin.settings.displayCalendar).onChange(async (value) => {
        this.plugin.settings.displayCalendar = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Frontmatter property names").setHeading();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "TimeLineX reads these frontmatter keys from your notes. Change them if you already use different property names."
    });
    new import_obsidian2.Setting(containerEl).setName("Date property").setDesc('e.g. "date: 1945-05-09" or "date: -531" for a bare year.').addText(
      (t) => t.setValue(this.plugin.settings.dateKey).onChange(async (v) => {
        this.plugin.settings.dateKey = v.trim() || "date";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("End date property").setDesc("Optional. Set this alongside the date property to represent a range.").addText(
      (t) => t.setValue(this.plugin.settings.dateEndKey).onChange(async (v) => {
        this.plugin.settings.dateEndKey = v.trim() || "date_end";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Timeline property").setDesc('A note belongs to a timeline via e.g. "timeline: History of Wars".').addText(
      (t) => t.setValue(this.plugin.settings.timelineKey).onChange(async (v) => {
        this.plugin.settings.timelineKey = v.trim() || "timeline";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Source calendar property").setDesc(
      `Optional. If a note's date is written in Persian or Hijri, set e.g. "calendar: persian" so it converts correctly. Defaults to Gregorian.`
    ).addText(
      (t) => t.setValue(this.plugin.settings.calendarKey).onChange(async (v) => {
        this.plugin.settings.calendarKey = v.trim() || "calendar";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Confirm drag edits before saving").setDesc(
      "When on, dragging or resizing an event on the timeline shows a Save/Cancel prompt instead of writing to the note immediately. Either way, a quick Undo option appears right after saving."
    ).addToggle(
      (t) => t.setValue(this.plugin.settings.confirmDragEdits).onChange(async (v) => {
        this.plugin.settings.confirmDragEdits = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Timeline colors").setHeading();
    const names = this.plugin.settings.timelineOrder;
    if (names.length === 0) {
      containerEl.createEl("p", {
        cls: "setting-item-description",
        text: "No timelines detected yet. Add dated notes to see them listed here."
      });
    }
    for (const name of names) {
      new import_obsidian2.Setting(containerEl).setName(name).addColorPicker(
        (cp) => {
          var _a;
          return cp.setValue((_a = this.plugin.settings.timelineColors[name]) != null ? _a : "#8b5cf6").onChange(async (v) => {
            this.plugin.settings.timelineColors[name] = v;
            await this.plugin.saveSettings();
          });
        }
      );
    }
  }
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  displayCalendar: "gregorian",
  dateKey: "date",
  dateEndKey: "date_end",
  timelineKey: "timeline",
  calendarKey: "calendar",
  timelineColors: {},
  timelineOrder: [],
  hiddenTimelines: [],
  confirmDragEdits: true
};

// src/timelineView.ts
var import_obsidian4 = require("obsidian");

// src/modals.ts
var import_obsidian3 = require("obsidian");
var NewEventModal = class extends import_obsidian3.Modal {
  constructor(app, defaultDate, defaultTimeline, defaultCalendar, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.title = "";
    this.dateEnd = "";
    this.date = defaultDate;
    this.timeline = defaultTimeline;
    this.calendar = defaultCalendar;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "New timeline note" });
    new import_obsidian3.Setting(contentEl).setName("Title").addText(
      (t) => t.setPlaceholder("Note title").onChange((v) => this.title = v.trim())
    );
    new import_obsidian3.Setting(contentEl).setName("Date").setDesc("e.g. 1945-05-09, 1945, or -531 for a BCE year.").addText(
      (t) => t.setValue(this.date).onChange((v) => this.date = v.trim())
    );
    new import_obsidian3.Setting(contentEl).setName("End date (optional)").setDesc("Leave empty for a single-point event.").addText(
      (t) => t.setValue(this.dateEnd).onChange((v) => this.dateEnd = v.trim())
    );
    new import_obsidian3.Setting(contentEl).setName("Timeline").addText(
      (t) => t.setValue(this.timeline).onChange((v) => this.timeline = v.trim())
    );
    new import_obsidian3.Setting(contentEl).setName("Calendar").setDesc("What calendar the date above is written in.").addDropdown(
      (dd) => dd.addOption("gregorian", CALENDAR_FULL_NAMES.gregorian).addOption("persian", CALENDAR_FULL_NAMES.persian).addOption("hijri", CALENDAR_FULL_NAMES.hijri).setValue(this.calendar).onChange((v) => this.calendar = v)
    );
    new import_obsidian3.Setting(contentEl).addButton(
      (b) => b.setButtonText("Create note").setCta().onClick(() => {
        if (!this.title || !this.date || !this.timeline) {
          new import_obsidian3.Notice("Title, date, and timeline are all required.");
          return;
        }
        void this.onSubmit({
          title: this.title,
          date: this.date,
          dateEnd: this.dateEnd,
          timeline: this.timeline,
          calendar: this.calendar
        });
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var RenameTimelineModal = class extends import_obsidian3.Modal {
  constructor(app, oldName, onSubmit) {
    super(app);
    this.oldName = oldName;
    this.onSubmit = onSubmit;
    this.newName = oldName;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Rename "${this.oldName}"` });
    contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "This updates the timeline property on every note currently in this timeline."
    });
    new import_obsidian3.Setting(contentEl).setName("New name").addText(
      (t) => t.setValue(this.newName).onChange((v) => this.newName = v.trim())
    );
    new import_obsidian3.Setting(contentEl).addButton(
      (b) => b.setButtonText("Rename").setCta().onClick(() => {
        if (!this.newName || this.newName === this.oldName) {
          this.close();
          return;
        }
        void this.onSubmit(this.newName);
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var MergeTimelineModal = class extends import_obsidian3.Modal {
  constructor(app, sourceName, otherNames, onSubmit) {
    var _a;
    super(app);
    this.sourceName = sourceName;
    this.otherNames = otherNames;
    this.onSubmit = onSubmit;
    this.target = "";
    this.target = (_a = otherNames[0]) != null ? _a : "";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Merge "${this.sourceName}" into\u2026` });
    contentEl.createEl("p", {
      cls: "setting-item-description",
      text: `All notes currently in "${this.sourceName}" will be reassigned to the timeline you choose below.`
    });
    new import_obsidian3.Setting(contentEl).setName("Target timeline").addDropdown((dd) => {
      for (const n of this.otherNames) dd.addOption(n, n);
      dd.setValue(this.target);
      dd.onChange((v) => this.target = v);
    });
    new import_obsidian3.Setting(contentEl).addButton(
      (b) => b.setButtonText("Merge").setDestructive().setCta().onClick(() => {
        if (!this.target) {
          new import_obsidian3.Notice("Choose a target timeline.");
          return;
        }
        void this.onSubmit(this.target);
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ConfirmModal = class extends import_obsidian3.Modal {
  constructor(app, message, confirmText, onConfirm) {
    super(app);
    this.message = message;
    this.confirmText = confirmText;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });
    const row = contentEl.createDiv({ cls: "modal-button-container" });
    const cancelBtn = row.createEl("button", { text: "Cancel" });
    cancelBtn.onclick = () => this.close();
    const confirmBtn = row.createEl("button", {
      text: this.confirmText,
      cls: "mod-warning"
    });
    confirmBtn.onclick = () => {
      void this.onConfirm();
      this.close();
    };
  }
  onClose() {
    this.contentEl.empty();
  }
};
var OrphanListModal = class extends import_obsidian3.Modal {
  constructor(app, titleText, items, onOpenFile) {
    super(app);
    this.titleText = titleText;
    this.items = items;
    this.onOpenFile = onOpenFile;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.titleText });
    if (this.items.length === 0) {
      contentEl.createEl("p", { text: "None." });
      return;
    }
    const list = contentEl.createEl("ul");
    for (const item of this.items) {
      const li = list.createEl("li");
      const link = li.createEl("a", { text: item.title, href: "#" });
      link.onclick = (e) => {
        e.preventDefault();
        this.onOpenFile(item.filePath);
        this.close();
      };
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/timelineView.ts
var VIEW_TYPE_TIMELINEX = "timelinex-view";
var MIN_YEARS_VISIBLE = 7 / 365;
var TICK_UNITS = [
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
  { years: 1e3, kind: "year" },
  { years: 2e3, kind: "year" },
  { years: 2500, kind: "year" },
  { years: 5e3, kind: "year" },
  { years: 1e4, kind: "year" }
];
function pickTickUnit(pixelsPerYear, totalYears, minPx = 90, maxTicks = 500) {
  for (const u of TICK_UNITS) {
    const spacingOk = u.years * pixelsPerYear >= minPx;
    const countOk = totalYears / u.years <= maxTicks;
    if (spacingOk && countOk) return u;
  }
  return TICK_UNITS[TICK_UNITS.length - 1];
}
function formatYearTickLabel(astronomicalYear, intervalYears) {
  const rounded = Math.round(astronomicalYear);
  const isBC = rounded <= 0;
  const civilYear = isBC ? 1 - rounded : rounded;
  const era = isBC ? "BC" : "AD";
  if (intervalYears >= 10) {
    const base = Math.floor(civilYear / intervalYears) * intervalYears;
    return `${base}s ${era}`;
  }
  return `${civilYear} ${era}`;
}
function assignLanes(events, minGapYears) {
  const sorted = [...events].sort((a, b) => a.startYear - b.startYear);
  const laneEnds = [];
  const map = /* @__PURE__ */ new Map();
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
function todayDecimalYear() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (now.getTime() - start) / (end - start);
}
function yearsVisibleForPercent(percent, totalYears) {
  const maxYears = Math.max(totalYears, MIN_YEARS_VISIBLE * 2);
  const ratio = MIN_YEARS_VISIBLE / maxYears;
  return maxYears * Math.pow(ratio, percent / 100);
}
function percentForYearsVisible(yearsVisible, totalYears) {
  const maxYears = Math.max(totalYears, MIN_YEARS_VISIBLE * 2);
  const ratio = MIN_YEARS_VISIBLE / maxYears;
  if (ratio <= 0 || ratio >= 1) return 0;
  const clamped = Math.min(Math.max(yearsVisible, MIN_YEARS_VISIBLE), maxYears);
  const p = 100 * Math.log(clamped / maxYears) / Math.log(ratio);
  return Math.min(100, Math.max(0, p));
}
var MAX_CONTENT_PX = 4e6;
var MIN_EVENT_SPAN_YEARS = 0.01;
var TimeLineXView = class extends import_obsidian4.ItemView {
  constructor(leaf, index, settings, saveSettings) {
    super(leaf);
    this.index = index;
    this.settings = settings;
    this.saveSettings = saveSettings;
    this.zoomPercent = 0;
    // 0 = whole timeline visible, 100 = ~7 days visible
    this.soloTimeline = null;
    this.unsubscribe = null;
    // Captured on every canvas render so the wheel-zoom handler can zoom
    // exactly to the cursor position after a full re-render.
    this.lastDataMin = 0;
    this.lastPixelsPerYear = 1;
    // Tracks the AbortController used for a given scroll container's
    // scroll/wheel listeners, so re-rendering into the same container (as the
    // zoom slider does) can cleanly tear down the previous listeners.
    this.canvasAbortControllers = /* @__PURE__ */ new WeakMap();
  }
  getViewType() {
    return VIEW_TYPE_TIMELINEX;
  }
  getDisplayText() {
    return "TimeLineX";
  }
  getIcon() {
    return "clock";
  }
  async onOpen() {
    this.containerEl.addClass("timelinex-root");
    this.unsubscribe = this.index.onExternalChange(() => this.render());
    this.render();
  }
  async onClose() {
    if (this.unsubscribe) this.unsubscribe();
  }
  async persist() {
    await this.saveSettings();
    this.render();
  }
  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("timelinex-view");
    const groups = this.index.getTimelineGroups();
    const sidebar = root.createDiv({ cls: "timelinex-sidebar" });
    const main = root.createDiv({ cls: "timelinex-main" });
    this.renderSidebar(sidebar, groups);
    this.renderMain(main, groups);
  }
  // ---------------- Sidebar ----------------
  renderSidebar(sidebar, groups) {
    const header = sidebar.createDiv({ cls: "timelinex-sidebar-header" });
    const titleRow = header.createDiv({ cls: "timelinex-sidebar-title" });
    (0, import_obsidian4.setIcon)(titleRow.createSpan({ cls: "timelinex-title-icon" }), "layers");
    titleRow.createSpan({
      text: this.soloTimeline ? this.soloTimeline : "Master Timeline"
    });
    header.createDiv({
      cls: "timelinex-sidebar-subtitle",
      text: this.soloTimeline ? "Viewing a single timeline." : "Overlay all timelines on one axis."
    });
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
        text: `Add "${this.settings.timelineKey}" and "${this.settings.dateKey}" properties to a note's frontmatter to see it here.`
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
        cls: "timelinex-solo-icon" + (this.soloTimeline === g.name ? " is-active" : "")
      });
      (0, import_obsidian4.setIcon)(solo, "crosshair");
      solo.setAttr(
        "title",
        this.soloTimeline === g.name ? "Back to overlay view" : "Solo view"
      );
      solo.onclick = () => {
        this.soloTimeline = this.soloTimeline === g.name ? null : g.name;
        this.render();
      };
      const eye = top.createSpan({ cls: "timelinex-eye-btn" });
      (0, import_obsidian4.setIcon)(eye, g.visible ? "eye" : "eye-off");
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
      (0, import_obsidian4.setIcon)(more, "more-vertical");
      more.setAttr("title", "Timeline actions");
      more.onclick = (e) => this.openTimelineActionsMenu(e, g, groups);
    }
    const allEvents = this.index.getAllEvents();
    const visibleCount = groups.filter((g) => g.visible).reduce((sum, g) => sum + g.events.length, 0);
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
      hint.onclick = () => new OrphanListModal(
        this.app,
        "Notes missing a timeline",
        missingTimeline,
        (path) => this.openFileByPath(path)
      ).open();
    }
    if (missingDate.length > 0) {
      const hint = footer.createDiv({ cls: "timelinex-orphan-hint" });
      hint.setText(
        `${missingDate.length} note${missingDate.length === 1 ? "" : "s"} have a timeline but no date`
      );
      hint.onclick = () => new OrphanListModal(
        this.app,
        "Notes missing a date",
        missingDate,
        (path) => this.openFileByPath(path)
      ).open();
    }
  }
  openFileByPath(path) {
    const file = this.index.getFile(path);
    if (file) void this.app.workspace.getLeaf(false).openFile(file);
  }
  openTimelineActionsMenu(e, group, allGroups) {
    const menu = new import_obsidian4.Menu();
    menu.addItem(
      (item) => item.setTitle("Rename timeline\u2026").setIcon("pencil").onClick(() => {
        new RenameTimelineModal(this.app, group.name, async (newName) => {
          await this.index.renameTimelineAcrossNotes(group.name, newName);
          this.renameInSettings(group.name, newName);
          await this.persist();
        }).open();
      })
    );
    const otherNames = allGroups.map((g) => g.name).filter((n) => n !== group.name);
    menu.addItem(
      (item) => item.setTitle("Merge into\u2026").setIcon("merge").onClick(() => {
        if (otherNames.length === 0) {
          new import_obsidian4.Notice("There are no other timelines to merge into.");
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
    menu.addItem(
      (item) => item.setTitle("Delete timeline (keep notes)").setIcon("trash").onClick(() => {
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
  renameInSettings(oldName, newName) {
    if (this.settings.timelineColors[oldName] !== void 0) {
      this.settings.timelineColors[newName] = this.settings.timelineColors[oldName];
      delete this.settings.timelineColors[oldName];
    }
    this.settings.timelineOrder = this.settings.timelineOrder.map(
      (n) => n === oldName ? newName : n
    );
    this.settings.hiddenTimelines = this.settings.hiddenTimelines.map(
      (n) => n === oldName ? newName : n
    );
    if (this.soloTimeline === oldName) this.soloTimeline = newName;
  }
  removeFromSettings(name) {
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
  computeDomain(events, today) {
    let dataMin;
    let dataMax;
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
  computeTicks(originYear, rangeMin, rangeMax, pixelsPerYear) {
    const visibleSpanYears = Math.max(rangeMax - rangeMin, 1e-6);
    const unit = pickTickUnit(pixelsPerYear, visibleSpanYears);
    const cal = this.settings.displayCalendar;
    const ticks = [];
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
      for (let i = 0; i < 2e3; i++) {
        const jdn2 = monthStartJdn(cal, y, m);
        const posYear = decimalYearFromGregorian(jdnToGregorian(jdn2));
        if (posYear > rangeMax) break;
        if (posYear >= rangeMin) {
          const left = (posYear - originYear) * pixelsPerYear;
          const label = unit.kind === "quarter" ? `Q${Math.ceil(m / 3)} ${y}` : `${CALENDAR_MONTH_NAMES[cal][m - 1]} ${y}`;
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
    const stepDays = unit.kind === "week" ? 7 : 1;
    const startGregorian = decimalYearToGregorian(rangeMin);
    let jdn = gregorianToJdn(startGregorian.y, startGregorian.m, startGregorian.d);
    jdn = Math.ceil(jdn / stepDays) * stepDays;
    for (let i = 0; i < 3e3; i++) {
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
  renderMain(main, groups) {
    main.empty();
    const visibleGroups = this.soloTimeline ? groups.filter((g) => g.name === this.soloTimeline) : groups.filter((g) => g.visible);
    const allVisibleEvents = visibleGroups.flatMap((g) => g.events);
    const today = todayDecimalYear();
    const { dataMin, dataMax, totalYears } = this.computeDomain(allVisibleEvents, today);
    const header = main.createDiv({ cls: "timelinex-main-header" });
    const titleBlock = header.createDiv();
    titleBlock.createDiv({
      cls: "timelinex-main-title",
      text: this.soloTimeline ? `${this.soloTimeline} \u2014 Solo` : "All Timelines \u2014 Overlay"
    });
    titleBlock.createDiv({
      cls: "timelinex-main-subtitle",
      text: `${allVisibleEvents.length} events across ${visibleGroups.length} timeline${visibleGroups.length === 1 ? "" : "s"}`
    });
    const toolbar = header.createDiv({ cls: "timelinex-toolbar" });
    const calWrap = toolbar.createDiv({ cls: "timelinex-toolbar-group" });
    calWrap.createSpan({ cls: "timelinex-toolbar-label", text: "Calendar" });
    const calSelect = calWrap.createEl("select", { cls: "dropdown timelinex-calendar-select" });
    Object.keys(CALENDAR_FULL_NAMES).forEach((cal) => {
      const opt = calSelect.createEl("option", {
        text: CALENDAR_FULL_NAMES[cal],
        value: cal
      });
      if (cal === this.settings.displayCalendar) opt.selected = true;
    });
    calSelect.onchange = () => {
      this.settings.displayCalendar = calSelect.value;
      void this.persist();
    };
    const zoomWrap = toolbar.createDiv({ cls: "timelinex-toolbar-group" });
    zoomWrap.createSpan({ cls: "timelinex-toolbar-label", text: "Zoom" });
    const zoomSelect = zoomWrap.createEl("select", { cls: "dropdown timelinex-zoom-select" });
    const allOption = zoomSelect.createEl("option", { text: "All (fit)", value: "all" });
    const presetYears = [totalYears];
    for (const level of ZOOM_LEVELS) {
      zoomSelect.createEl("option", { text: level.label, value: level.id });
      presetYears.push(level.yearsVisible);
    }
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
      var _a, _b;
      const value = zoomSelect.value;
      const targetYears = value === "all" ? totalYears : (_b = (_a = ZOOM_LEVELS.find((l) => l.id === value)) == null ? void 0 : _a.yearsVisible) != null ? _b : totalYears;
      this.zoomPercent = percentForYearsVisible(targetYears, totalYears);
      this.render();
    };
    let scrollContainer;
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
      text: `${Math.round(this.zoomPercent)}%`
    });
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
    slider.onchange = () => {
      this.render();
    };
    scrollContainer = main.createDiv({ cls: "timelinex-scroll-container" });
    this.renderTimelineCanvas(scrollContainer, visibleGroups, allVisibleEvents, dataMin, dataMax, totalYears);
  }
  renderTimelineCanvas(container, groups, events, dataMin, dataMax, totalYears) {
    var _a;
    const prevController = this.canvasAbortControllers.get(container);
    if (prevController) prevController.abort();
    const abortController = new AbortController();
    this.canvasAbortControllers.set(container, abortController);
    const { signal } = abortController;
    const today = todayDecimalYear();
    const viewportWidth = Math.max(container.clientWidth, 800);
    const yearsVisible = yearsVisibleForPercent(this.zoomPercent, totalYears);
    let pixelsPerYear = viewportWidth / yearsVisible;
    const maxPxPerYear = MAX_CONTENT_PX / totalYears;
    pixelsPerYear = Math.min(pixelsPerYear, maxPxPerYear);
    this.lastDataMin = dataMin;
    this.lastPixelsPerYear = pixelsPerYear;
    const contentWidth = totalYears * pixelsPerYear;
    const canvas = container.createDiv({ cls: "timelinex-canvas" });
    canvas.style.width = `${contentWidth}px`;
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
    let scrollTickRaf = null;
    container.addEventListener(
      "scroll",
      () => {
        if (scrollTickRaf !== null) return;
        scrollTickRaf = window.requestAnimationFrame(() => {
          scrollTickRaf = null;
          renderVisibleTicks();
        });
      },
      { signal }
    );
    if (today >= dataMin && today <= dataMax) {
      const todayLeft = (today - dataMin) * pixelsPerYear;
      const line = canvas.createDiv({ cls: "timelinex-today-line" });
      line.style.left = `${todayLeft}px`;
      const label = canvas.createDiv({ cls: "timelinex-today-label" });
      label.style.left = `${todayLeft}px`;
      label.setText("Today");
    }
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
      track.addEventListener("dblclick", (e) => {
        if (e.target.closest(".timelinex-pill")) return;
        const trackRect = track.getBoundingClientRect();
        const clickX = e.clientX - trackRect.left;
        const clickYear = dataMin + clickX / pixelsPerYear;
        this.openNewEventModal(group.name, clickYear);
      });
      for (const ev of group.events) {
        const lane = (_a = laneMap.get(ev)) != null ? _a : 0;
        const left = (ev.startYear - dataMin) * pixelsPerYear;
        const minWidth = ev.isRange ? 24 : 14;
        const width = Math.max(minWidth, (ev.endYear - ev.startYear) * pixelsPerYear);
        const pill = track.createDiv({
          cls: "timelinex-pill" + (ev.isRange ? "" : " is-point")
        });
        pill.style.left = `${left}px`;
        pill.style.width = `${width}px`;
        pill.style.top = `${8 + lane * 26}px`;
        pill.style.backgroundColor = group.color;
        pill.setText(ev.title);
        pill.setAttr(
          "title",
          `${ev.title}
${group.name}
${this.formatEventRange(ev)}
(drag to move, edges to resize)`
        );
        this.attachPillInteractions(pill, ev, pixelsPerYear, dataMin, minWidth);
      }
    }
    container.addEventListener(
      "wheel",
      (e) => {
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
        );
        if (newContainer) {
          const newScrollLeft = (yearUnderCursor - this.lastDataMin) * this.lastPixelsPerYear - cursorX;
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
  attachPillInteractions(pill, ev, pixelsPerYear, dataMin, minWidth) {
    let mode = null;
    let startClientX = 0;
    let originStart = ev.startYear;
    let originEnd = ev.endYear;
    let pendingStart = ev.startYear;
    let pendingEnd = ev.endYear;
    let moved = false;
    const onMouseMove = (e) => {
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
      activeDocument.removeEventListener("mousemove", onMouseMove);
      activeDocument.removeEventListener("mouseup", onMouseUp);
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
    const startDrag = (nextMode) => (e) => {
      e.stopPropagation();
      e.preventDefault();
      mode = nextMode;
      startClientX = e.clientX;
      originStart = ev.startYear;
      originEnd = ev.endYear;
      pendingStart = ev.startYear;
      pendingEnd = ev.endYear;
      moved = false;
      activeDocument.addEventListener("mousemove", onMouseMove);
      activeDocument.addEventListener("mouseup", onMouseUp);
    };
    pill.onmousedown = startDrag("move");
    pill.onclick = () => {
      if (moved) return;
      const file = this.index.getFile(ev.filePath);
      if (file) void this.app.workspace.getLeaf(false).openFile(file);
    };
    if (ev.isRange) {
      const leftHandle = pill.createDiv({ cls: "timelinex-resize-handle is-left" });
      leftHandle.onmousedown = startDrag("resize-start");
      const rightHandle = pill.createDiv({ cls: "timelinex-resize-handle is-right" });
      rightHandle.onmousedown = startDrag("resize-end");
    }
  }
  async commitEventDates(ev, newStartYear, newEndYear) {
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
  showDragConfirmation(pill, ev, newStart, newEnd) {
    const rect = pill.getBoundingClientRect();
    const bar = activeDocument.body.createDiv({ cls: "timelinex-drag-confirm" });
    bar.style.left = `${Math.max(4, rect.left)}px`;
    bar.style.top = `${rect.bottom + 6}px`;
    bar.createSpan({
      text: `Move "${ev.title}" to ${this.formatEventRangeFor(newStart, newEnd, ev.isRange)}?`
    });
    const actions = bar.createDiv({ cls: "timelinex-drag-confirm-actions" });
    const saveBtn = actions.createEl("button", { text: "Save", cls: "mod-cta" });
    const cancelBtn = actions.createEl("button", { text: "Cancel" });
    let settled = false;
    const cleanup = () => {
      bar.remove();
      activeDocument.removeEventListener("mousedown", onOutsideClick, true);
    };
    const onOutsideClick = (e) => {
      if (settled) return;
      if (!bar.contains(e.target)) {
        settled = true;
        cleanup();
        this.render();
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
    window.setTimeout(() => activeDocument.addEventListener("mousedown", onOutsideClick, true), 0);
  }
  /** Writes the new date(s) to frontmatter, then offers a quick Undo toast. */
  async commitEventDatesWithUndo(ev, newStartYear, newEndYear) {
    const prevStart = ev.startYear;
    const prevEnd = ev.endYear;
    await this.commitEventDates(ev, newStartYear, newEndYear);
    const frag = activeDocument.createDocumentFragment();
    frag.createSpan({
      text: `Updated "${ev.title}" to ${this.formatEventRangeFor(newStartYear, newEndYear, ev.isRange)}. `
    });
    const undoLink = frag.createEl("a", { text: "Undo", cls: "timelinex-undo-link" });
    const notice = new import_obsidian4.Notice(frag, 8e3);
    undoLink.onclick = () => {
      void this.commitEventDates(ev, prevStart, prevEnd);
      notice.hide();
    };
  }
  formatEventRangeFor(start, end, isRange) {
    const s = Math.round(start);
    const e = Math.round(end);
    return isRange ? `${s} \u2013 ${e}` : `${s}`;
  }
  // ---------------- Creating notes from the timeline ----------------
  openNewEventModal(timelineName, clickYear) {
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
  async createNoteFromModal(data) {
    const sanitized = data.title.replace(/[\\/:*?"<>|]/g, "").trim() || "Untitled";
    let path = `${sanitized}.md`;
    let counter = 1;
    while (this.app.vault.getAbstractFileByPath(path)) {
      counter += 1;
      path = `${sanitized} (${counter}).md`;
    }
    const fmLines = [`${this.settings.dateKey}: ${data.date}`];
    if (data.dateEnd) fmLines.push(`${this.settings.dateEndKey}: ${data.dateEnd}`);
    fmLines.push(`${this.settings.timelineKey}: ${data.timeline}`);
    if (data.calendar !== "gregorian") {
      fmLines.push(`${this.settings.calendarKey}: ${data.calendar}`);
    }
    const content = `---
${fmLines.join("\n")}
---

# ${data.title}
`;
    const file = await this.app.vault.create(path, content);
    await this.app.workspace.getLeaf(false).openFile(file);
  }
  formatEventRange(ev) {
    const startLabel = Math.round(ev.startYear);
    const endLabel = Math.round(ev.endYear);
    return ev.isRange ? `${startLabel} \u2013 ${endLabel}` : `${startLabel}`;
  }
};

// main.ts
var TimeLineXPlugin = class extends import_obsidian5.Plugin {
  async onload() {
    await this.loadSettings();
    this.index = new TimeLineXIndex(this.app, this.settings);
    this.addChild(this.index);
    this.registerView(
      VIEW_TYPE_TIMELINEX,
      (leaf) => new TimeLineXView(
        leaf,
        this.index,
        this.settings,
        () => this.saveSettings()
      )
    );
    this.addRibbonIcon("clock", "Open TimeLineX", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-timeline-view",
      name: "Open timeline view",
      callback: () => void this.activateView()
    });
    this.addCommand({
      id: "set-date-and-timeline",
      name: "Set date & timeline for this note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) {
          new TimeLineXDateModal(this.app, this, file).open();
        }
        return true;
      }
    });
    this.addSettingTab(new TimeLineXSettingTab(this.app, this));
  }
  onunload() {
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_TIMELINEX)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_TIMELINEX, active: true });
    }
    await workspace.revealLeaf(leaf);
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded != null ? loaded : {});
  }
  async saveSettings() {
    var _a;
    await this.saveData(this.settings);
    (_a = this.index) == null ? void 0 : _a.rebuild();
  }
};
var TimeLineXDateModal = class extends import_obsidian5.Modal {
  constructor(app, plugin, file) {
    super(app);
    this.plugin = plugin;
    this.file = file;
    this.date = "";
    this.dateEnd = "";
    this.timeline = "";
    this.calendar = "gregorian";
  }
  onOpen() {
    var _a, _b, _c;
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `TimeLineX date \u2014 ${this.file.basename}` });
    const cache = this.app.metadataCache.getFileCache(this.file);
    const fm = cache == null ? void 0 : cache.frontmatter;
    if (fm) {
      this.date = String((_a = fm[this.plugin.settings.dateKey]) != null ? _a : "");
      this.dateEnd = String((_b = fm[this.plugin.settings.dateEndKey]) != null ? _b : "");
      this.timeline = String((_c = fm[this.plugin.settings.timelineKey]) != null ? _c : "");
      this.calendar = fm[this.plugin.settings.calendarKey] || "gregorian";
    }
    new import_obsidian5.Setting(contentEl).setName("Date").setDesc("e.g. 1945-05-09, 1945, or -531 for a BCE year.").addText(
      (t) => t.setValue(this.date).onChange((v) => this.date = v.trim())
    );
    new import_obsidian5.Setting(contentEl).setName("End date (optional)").setDesc("Leave empty for a single-point event; fill in to make a range.").addText(
      (t) => t.setValue(this.dateEnd).onChange((v) => this.dateEnd = v.trim())
    );
    new import_obsidian5.Setting(contentEl).setName("Timeline").setDesc("Which timeline this note belongs to, e.g. 'History of Wars'.").addText(
      (t) => t.setValue(this.timeline).onChange((v) => this.timeline = v.trim())
    );
    new import_obsidian5.Setting(contentEl).setName("Source calendar").setDesc("What calendar the date above is written in.").addDropdown(
      (dd) => dd.addOption("gregorian", CALENDAR_FULL_NAMES.gregorian).addOption("persian", CALENDAR_FULL_NAMES.persian).addOption("hijri", CALENDAR_FULL_NAMES.hijri).setValue(this.calendar).onChange((v) => this.calendar = v)
    );
    new import_obsidian5.Setting(contentEl).addButton(
      (b) => b.setButtonText("Save").setCta().onClick(() => void this.save())
    );
  }
  async save() {
    if (!this.date || !this.timeline) {
      new import_obsidian5.Notice("Date and Timeline are both required.");
      return;
    }
    const s = this.plugin.settings;
    await this.app.fileManager.processFrontMatter(this.file, (fm) => {
      fm[s.dateKey] = this.date;
      if (this.dateEnd) fm[s.dateEndKey] = this.dateEnd;
      else delete fm[s.dateEndKey];
      fm[s.timelineKey] = this.timeline;
      if (this.calendar !== "gregorian") fm[s.calendarKey] = this.calendar;
      else delete fm[s.calendarKey];
    });
    new import_obsidian5.Notice("TimeLineX date saved.");
    this.close();
  }
  onClose() {
    this.contentEl.empty();
  }
};
