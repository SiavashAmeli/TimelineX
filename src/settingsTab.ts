import { App, PluginSettingTab, Setting } from "obsidian";
import type TimeLineXPlugin from "../main";
import { CALENDAR_FULL_NAMES, CalendarSystem } from "./calendars";

export class TimeLineXSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: TimeLineXPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Display calendar")
      .setDesc(
        "Calendar used to label years and dates on the timeline. This only affects display — your notes' frontmatter is untouched."
      )
      .addDropdown((dd) =>
        dd
          .addOption("gregorian", CALENDAR_FULL_NAMES.gregorian)
          .addOption("persian", CALENDAR_FULL_NAMES.persian)
          .addOption("hijri", CALENDAR_FULL_NAMES.hijri)
          .setValue(this.plugin.settings.displayCalendar)
          .onChange(async (value) => {
            this.plugin.settings.displayCalendar = value as CalendarSystem;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Frontmatter property names").setHeading();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text:
        "TimeLineX reads these frontmatter keys from your notes. Change them if you already use different property names.",
    });

    new Setting(containerEl)
      .setName("Date property")
      .setDesc('e.g. "date: 1945-05-09" or "date: -531" for a bare year.')
      .addText((t) =>
        t.setValue(this.plugin.settings.dateKey).onChange(async (v) => {
          this.plugin.settings.dateKey = v.trim() || "date";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("End date property")
      .setDesc("Optional. Set this alongside the date property to represent a range.")
      .addText((t) =>
        t.setValue(this.plugin.settings.dateEndKey).onChange(async (v) => {
          this.plugin.settings.dateEndKey = v.trim() || "date_end";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Timeline property")
      .setDesc('A note belongs to a timeline via e.g. "timeline: History of Wars".')
      .addText((t) =>
        t.setValue(this.plugin.settings.timelineKey).onChange(async (v) => {
          this.plugin.settings.timelineKey = v.trim() || "timeline";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Source calendar property")
      .setDesc(
        'Optional. If a note\'s date is written in Persian or Hijri, set e.g. "calendar: persian" so it converts correctly. Defaults to Gregorian.'
      )
      .addText((t) =>
        t.setValue(this.plugin.settings.calendarKey).onChange(async (v) => {
          this.plugin.settings.calendarKey = v.trim() || "calendar";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Confirm drag edits before saving")
      .setDesc(
        "When on, dragging or resizing an event on the timeline shows a Save/Cancel prompt instead of writing to the note immediately. Either way, a quick Undo option appears right after saving."
      )
      .addToggle((t) =>
        t.setValue(this.plugin.settings.confirmDragEdits).onChange(async (v) => {
          this.plugin.settings.confirmDragEdits = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName("Timeline colors").setHeading();
    const names = this.plugin.settings.timelineOrder;
    if (names.length === 0) {
      containerEl.createEl("p", {
        cls: "setting-item-description",
        text: "No timelines detected yet. Add dated notes to see them listed here.",
      });
    }
    for (const name of names) {
      new Setting(containerEl).setName(name).addColorPicker((cp) =>
        cp
          .setValue(this.plugin.settings.timelineColors[name] ?? "#8b5cf6")
          .onChange(async (v) => {
            this.plugin.settings.timelineColors[name] = v;
            await this.plugin.saveSettings();
          })
      );
    }
  }
}
