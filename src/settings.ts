import { App, PluginSettingTab, Setting } from "obsidian";

import StatisticsPlugin from "./main";

export interface StatisticsPluginSettings {
  displayIndividualItems: boolean,
  showNotes: boolean,
  showAttachments: boolean,
  showFiles: boolean,
  showLinks: boolean,
  showWords: boolean,
  showSize: boolean,
}

export class StatisticsPluginSettingTab extends PluginSettingTab {
  plugin: StatisticsPlugin;

  constructor(app: App, plugin: StatisticsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();
    
    new Setting(containerEl)
      .setName("Show individual items")
      .setDesc("Whether to show multiple items at once or cycle them with a click")
      .addToggle((value) => {
        value
          .setValue(this.plugin.settings.displayIndividualItems)
          .onChange(async (value) => {
            this.plugin.settings.displayIndividualItems = value;
            this.display();
            await this.plugin.saveSettings();
          });
      });

    if (!this.plugin.settings.displayIndividualItems) {
      return;
    }

    new Setting(containerEl)
      .setName("Show notes")
      .addToggle((value) => {
        value
          .setValue(this.plugin.settings.showNotes)
          .onChange(async (value) => {
            this.plugin.settings.showNotes = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show attachments")
      .addToggle((value) => {
        value
          .setValue(this.plugin.settings.showAttachments)
          .onChange(async (value) => {
            this.plugin.settings.showAttachments = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show files")
      .addToggle((value) => {
        value
          .setValue(this.plugin.settings.showFiles)
          .onChange(async (value) => {
            this.plugin.settings.showFiles = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show links")
      .addToggle((value) => {
        value
          .setValue(this.plugin.settings.showLinks)
          .onChange(async (value) => {
            this.plugin.settings.showLinks = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show words")
      .addToggle((value) => {
        value
          .setValue(this.plugin.settings.showWords)
          .onChange(async (value) => {
            this.plugin.settings.showWords = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Show size")
      .addToggle((value) => {
        value
          .setValue(this.plugin.settings.showSize)
          .onChange(async (value) => {
            this.plugin.settings.showSize = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
