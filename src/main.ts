import { Component, Vault, TFile, Plugin, debounce, MetadataCache, CachedMetadata, TFolder } from 'obsidian';
import { BytesFormatter, DecimalUnitFormatter } from './format';
import { VaultMetrics } from './metrics';
import { VaultMetricsCollector } from './collect';
import { StatisticsPluginSettings, StatisticsPluginSettingTab } from './settings';

const DEFAULT_SETTINGS: Partial<StatisticsPluginSettings> = {
  displayIndividualItems: false,
  showNotes: false,
  showAttachments: false,
  showFiles: false,
  showLinks: false,
  showWords: false,
  showSize: false,
};

export default class StatisticsPlugin extends Plugin {

  private statusBarItem: StatisticsStatusBarItem = null;

  public vaultMetricsCollector: VaultMetricsCollector;
  public vaultMetrics: VaultMetrics;

  settings: StatisticsPluginSettings;

  async onload() {
    console.log('Loading vault-statistics Plugin');
    
    await this.loadSettings();

    this.vaultMetrics = new VaultMetrics();

    this.vaultMetricsCollector = new VaultMetricsCollector(this).
      setVault(this.app.vault).
      setMetadataCache(this.app.metadataCache).
      setVaultMetrics(this.vaultMetrics).
      start();

    this.statusBarItem = new StatisticsStatusBarItem(this, this.addStatusBarItem()).
      setVaultMetrics(this.vaultMetrics);

    this.addSettingTab(new StatisticsPluginSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
    this.statusBarItem.refresh();
  }
}

/**
 * {@link StatisticView} is responsible for maintaining the DOM representation
 * of a given statistic.
 */
class StatisticView {

  /** Root node for the {@link StatisticView}. */
  private containerEl: HTMLElement;

  /** Formatter that extracts and formats a value from a {@link Statistics} instance. */
  private formatter: (s: VaultMetrics) => string;

  /**
   * Constructor.
   *
   * @param containerEl The parent element for the view.
   */
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl.createSpan({ cls: ["obsidian-vault-statistics--item"] });
    this.setActive(false);
  }

  /**
   * Sets the name of the statistic.
   */
  setStatisticName(name: string): StatisticView {
    this.containerEl.addClass(`obsidian-vault-statistics--item-${name}`);
    return this;
  }

  /**
   * Sets the formatter to use to produce the content of the view.
   */
  setFormatter(formatter: (s: VaultMetrics) => string): StatisticView {
    this.formatter = formatter;
    return this;
  }

  /**
   * Updates the view with the desired active status.
   *
   * Active views have the CSS class `obsidian-vault-statistics--item-active`
   * applied, inactive views have the CSS class
   * `obsidian-vault-statistics--item-inactive` applied. These classes are
   * mutually exclusive.
   */
  setActive(isActive: boolean): StatisticView {
    this.containerEl.removeClass("obsidian-vault-statistics--item--active");
    this.containerEl.removeClass("obsidian-vault-statistics--item--inactive");

    if (isActive) {
      this.containerEl.addClass("obsidian-vault-statistics--item--active");
    } else {
      this.containerEl.addClass("obsidian-vault-statistics--item--inactive");
    }

    return this;
  }

  /**
   * Refreshes the content of the view with content from the passed {@link
   * Statistics}.
   */
  refresh(s: VaultMetrics) {
    this.containerEl.setText(this.formatter(s));
  }

  /**
   * Returns the text content of the view.
   */
  getText(): string {
    return this.containerEl.getText();
  }
}

class StatisticsStatusBarItem {

  private owner: StatisticsPlugin;

  // handle of the status bar item to draw into.
  private statusBarItem: HTMLElement;

  // raw stats
  private vaultMetrics: VaultMetrics;

  // index of the currently displayed stat.
  private displayedStatisticIndex = 0;

  private statisticViews: Array<StatisticView> = [];

  constructor(owner: StatisticsPlugin, statusBarItem: HTMLElement) {
    this.owner = owner;
    this.statusBarItem = statusBarItem;

    this.statisticViews.push(new StatisticView(this.statusBarItem).
      setStatisticName("notes").
      setFormatter((s: VaultMetrics) => { return new DecimalUnitFormatter("notes").format(s.notes) }));
    this.statisticViews.push(new StatisticView(this.statusBarItem).
      setStatisticName("attachments").
      setFormatter((s: VaultMetrics) => { return new DecimalUnitFormatter("attachments").format(s.attachments) }));
    this.statisticViews.push(new StatisticView(this.statusBarItem).
      setStatisticName("files").
      setFormatter((s: VaultMetrics) => { return new DecimalUnitFormatter("files").format(s.files) }));
    this.statisticViews.push(new StatisticView(this.statusBarItem).
      setStatisticName("links").
      setFormatter((s: VaultMetrics) => { return new DecimalUnitFormatter("links").format(s.links) }));
    this.statisticViews.push(new StatisticView(this.statusBarItem).
      setStatisticName("words").
      setFormatter((s: VaultMetrics) => { return new DecimalUnitFormatter("words").format(s.words) }));
    this.statisticViews.push(new StatisticView(this.statusBarItem).
      setStatisticName("size").
      setFormatter((s: VaultMetrics) => { return new BytesFormatter().format(s.size) }));

    this.statusBarItem.onClickEvent(() => { this.onclick() });
  }

  public setVaultMetrics(vaultMetrics: VaultMetrics) {
    this.vaultMetrics = vaultMetrics;
    this.owner.registerEvent(this.vaultMetrics?.on("updated", this.refreshSoon));
    this.refreshSoon();
    return this;
  }

  private refreshSoon = debounce(() => { this.refresh(); }, 2000, false);

  public refresh() {
    if (this.owner.settings.displayIndividualItems) {
      this.statisticViews[0].setActive(this.owner.settings.showNotes).refresh(this.vaultMetrics);
      this.statisticViews[1].setActive(this.owner.settings.showAttachments).refresh(this.vaultMetrics);
      this.statisticViews[2].setActive(this.owner.settings.showFiles).refresh(this.vaultMetrics);
      this.statisticViews[3].setActive(this.owner.settings.showLinks).refresh(this.vaultMetrics);
      this.statisticViews[4].setActive(this.owner.settings.showWords).refresh(this.vaultMetrics);
      this.statisticViews[5].setActive(this.owner.settings.showSize).refresh(this.vaultMetrics);
    } else {
      this.statisticViews.forEach((view, i) => {
        view.setActive(this.displayedStatisticIndex == i).refresh(this.vaultMetrics);
      });
    }

    this.statusBarItem.title = this.statisticViews.map(view => view.getText()).join("\n");
  }

  private onclick() {
    if (!this.owner.settings.displayIndividualItems) {
      this.displayedStatisticIndex = (this.displayedStatisticIndex + 1) % this.statisticViews.length;
    }
    this.refresh();
  }
}
