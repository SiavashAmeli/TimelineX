import { App, Modal, Notice, Setting } from "obsidian";
import { CALENDAR_FULL_NAMES, CalendarSystem } from "./calendars";
import { OrphanNote } from "./types";

export interface NewEventData {
  title: string;
  date: string;
  dateEnd: string;
  timeline: string;
  calendar: CalendarSystem;
}

/** Prompts for a title (and lets the pre-filled date/timeline/calendar be
 * adjusted) when creating a new note by double-clicking an empty spot on a
 * timeline. */
export class NewEventModal extends Modal {
  private title = "";
  private date: string;
  private dateEnd = "";
  private timeline: string;
  private calendar: CalendarSystem;

  constructor(
    app: App,
    defaultDate: string,
    defaultTimeline: string,
    defaultCalendar: CalendarSystem,
    private onSubmit: (data: NewEventData) => void | Promise<void>
  ) {
    super(app);
    this.date = defaultDate;
    this.timeline = defaultTimeline;
    this.calendar = defaultCalendar;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "New timeline note" });

    new Setting(contentEl).setName("Title").addText((t) =>
      t.setPlaceholder("Note title").onChange((v) => (this.title = v.trim()))
    );

    new Setting(contentEl)
      .setName("Date")
      .setDesc("e.g. 1945-05-09, 1945, or -531 for a BCE year.")
      .addText((t) =>
        t.setValue(this.date).onChange((v) => (this.date = v.trim()))
      );

    new Setting(contentEl)
      .setName("End date (optional)")
      .setDesc("Leave empty for a single-point event.")
      .addText((t) =>
        t.setValue(this.dateEnd).onChange((v) => (this.dateEnd = v.trim()))
      );

    new Setting(contentEl).setName("Timeline").addText((t) =>
      t.setValue(this.timeline).onChange((v) => (this.timeline = v.trim()))
    );

    new Setting(contentEl)
      .setName("Calendar")
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
        .setButtonText("Create note")
        .setCta()
        .onClick(() => {
          if (!this.title || !this.date || !this.timeline) {
            new Notice("Title, date, and timeline are all required.");
            return;
          }
          void this.onSubmit({
            title: this.title,
            date: this.date,
            dateEnd: this.dateEnd,
            timeline: this.timeline,
            calendar: this.calendar,
          });
          this.close();
        })
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class RenameTimelineModal extends Modal {
  private newName: string;

  constructor(
    app: App,
    private oldName: string,
    private onSubmit: (newName: string) => void | Promise<void>
  ) {
    super(app);
    this.newName = oldName;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Rename "${this.oldName}"` });
    contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "This updates the timeline property on every note currently in this timeline.",
    });
    new Setting(contentEl).setName("New name").addText((t) =>
      t.setValue(this.newName).onChange((v) => (this.newName = v.trim()))
    );
    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText("Rename")
        .setCta()
        .onClick(() => {
          if (!this.newName || this.newName === this.oldName) {
            this.close();
            return;
          }
          void this.onSubmit(this.newName);
          this.close();
        })
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class MergeTimelineModal extends Modal {
  private target = "";

  constructor(
    app: App,
    private sourceName: string,
    private otherNames: string[],
    private onSubmit: (target: string) => void | Promise<void>
  ) {
    super(app);
    this.target = otherNames[0] ?? "";
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Merge "${this.sourceName}" into…` });
    contentEl.createEl("p", {
      cls: "setting-item-description",
      text: `All notes currently in "${this.sourceName}" will be reassigned to the timeline you choose below.`,
    });
    new Setting(contentEl).setName("Target timeline").addDropdown((dd) => {
      for (const n of this.otherNames) dd.addOption(n, n);
      dd.setValue(this.target);
      dd.onChange((v) => (this.target = v));
    });
    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText("Merge")
        .setDestructive()
        .setCta()
        .onClick(() => {
          if (!this.target) {
            new Notice("Choose a target timeline.");
            return;
          }
          void this.onSubmit(this.target);
          this.close();
        })
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private confirmText: string,
    private onConfirm: () => void | Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });
    const row = contentEl.createDiv({ cls: "modal-button-container" });
    const cancelBtn = row.createEl("button", { text: "Cancel" });
    cancelBtn.onclick = () => this.close();
    const confirmBtn = row.createEl("button", {
      text: this.confirmText,
      cls: "mod-warning",
    });
    confirmBtn.onclick = () => {
      void this.onConfirm();
      this.close();
    };
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class OrphanListModal extends Modal {
  constructor(
    app: App,
    private titleText: string,
    private items: OrphanNote[],
    private onOpenFile: (path: string) => void
  ) {
    super(app);
  }

  onOpen(): void {
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

  onClose(): void {
    this.contentEl.empty();
  }
}
