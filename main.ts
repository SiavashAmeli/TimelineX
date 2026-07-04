import { App, Modal, Notice, Plugin, Setting, TFile, WorkspaceLeaf } from "obsidian";
import { TimeLineXIndex } from "./src/timelineIndex";
import { TimeLineXSettingTab } from "./src/settingsTab";
import { TimeLineXSettings, DEFAULT_SETTINGS } from "./src/settings";
import { TimeLineXView, VIEW_TYPE_TIMELINEX } from "./src/timelineView";
import { CALENDAR_FULL_NAMES, CalendarSystem } from "./src/calendars";
import { toFrontmatterRecord } from "./src/frontmatter";

export default class TimeLineXPlugin extends Plugin {
  settings!: TimeLineXSettings;
  index!: TimeLineXIndex;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.index = new TimeLineXIndex(this.app, this.settings);
    this.addChild(this.index);

    this.registerView(
      VIEW_TYPE_TIMELINEX,
      (leaf: WorkspaceLeaf) =>
        new TimeLineXView(leaf, this.index, this.settings, () =>
          this.saveSettings()
        )
    );

    this.addRibbonIcon("clock", "Open TimeLineX", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-timeline-view",
      name: "Open timeline view",
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "set-date-and-timeline",
      name: "Set date & timeline for this note",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) {
          new TimeLineXDateModal(this.app, this, file).open();
        }
        return true;
      },
    });

    this.addSettingTab(new TimeLineXSettingTab(this.app, this));
  }

  onunload(): void {
    // View instances are cleaned up by Obsidian; TimeLineXIndex is a child
    // component so it unloads automatically too.
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_TIMELINEX)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_TIMELINEX, active: true });
    }
    await workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<TimeLineXSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded ?? {});
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.index?.rebuild();
  }
}

class TimeLineXDateModal extends Modal {
  private date = "";
  private dateEnd = "";
  private timeline = "";
  private calendar: CalendarSystem = "gregorian";

  constructor(app: App, private plugin: TimeLineXPlugin, private file: TFile) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `TimeLineX date — ${this.file.basename}` });

    const cache = this.app.metadataCache.getFileCache(this.file);
    const fm = toFrontmatterRecord(cache?.frontmatter);
    if (fm) {
      this.date = String(fm[this.plugin.settings.dateKey] ?? "");
      this.dateEnd = String(fm[this.plugin.settings.dateEndKey] ?? "");
      this.timeline = String(fm[this.plugin.settings.timelineKey] ?? "");
      this.calendar = (fm[this.plugin.settings.calendarKey] as CalendarSystem) || "gregorian";
    }

    new Setting(contentEl)
      .setName("Date")
      .setDesc("e.g. 1945-05-09, 1945, or -531 for a BCE year.")
      .addText((t) =>
        t.setValue(this.date).onChange((v) => (this.date = v.trim()))
      );

    new Setting(contentEl)
      .setName("End date (optional)")
      .setDesc("Leave empty for a single-point event; fill in to make a range.")
      .addText((t) =>
        t.setValue(this.dateEnd).onChange((v) => (this.dateEnd = v.trim()))
      );

    new Setting(contentEl)
      .setName("Timeline")
      .setDesc("Which timeline this note belongs to, e.g. 'History of Wars'.")
      .addText((t) =>
        t.setValue(this.timeline).onChange((v) => (this.timeline = v.trim()))
      );

    new Setting(contentEl)
      .setName("Source calendar")
      .setDesc("What calendar the date above is written in.")
      .addDropdown((dd) =>
        dd
          .addOption("gregorian", CALENDAR_FULL_NAMES.gregorian)
          .addOption("persian", CALENDAR_FULL_NAMES.persian)
          .addOption("hijri", CALENDAR_FULL_NAMES.hijri)
          .setValue(this.calendar)
          .onChange((v) => (this.calendar = v as CalendarSystem))
      );

    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText("Save")
        .setCta()
        .onClick(() => void this.save())
    );
  }

  private async save(): Promise<void> {
    if (!this.date || !this.timeline) {
      new Notice("Date and Timeline are both required.");
      return;
    }
    const s = this.plugin.settings;
    await this.app.fileManager.processFrontMatter(this.file, (fm: Record<string, unknown>) => {
      fm[s.dateKey] = this.date;
      if (this.dateEnd) fm[s.dateEndKey] = this.dateEnd;
      else delete fm[s.dateEndKey];
      fm[s.timelineKey] = this.timeline;
      if (this.calendar !== "gregorian") fm[s.calendarKey] = this.calendar;
      else delete fm[s.calendarKey];
    });
    new Notice("TimeLineX date saved.");
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
