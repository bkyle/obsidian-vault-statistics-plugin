import { Events, EventRef, Component, Vault, TFile, Plugin, debounce, MetadataCache, CachedMetadata, TFolder } from 'obsidian';

export default class StatisticsPlugin extends Plugin {

	private statusBarItem: StatisticsStatusBarItem = null;

	public fileMetricsCollector: FileMetricsCollector;
	public vaultMetrics: VaultMetrics;

	async onload() {
		console.log('Loading vault-statistics Plugin');

		this.vaultMetrics = new VaultMetrics();

		this.fileMetricsCollector = new FileMetricsCollector(this).
			setVault(this.app.vault).
			setMetadataCache(this.app.metadataCache).
			setVaultMetrics(this.vaultMetrics).
			start();

		this.statusBarItem = new StatisticsStatusBarItem(this, this.addStatusBarItem()).
			setVaultMetrics(this.vaultMetrics);
	}
}

abstract class Formatter {
	public abstract format(value: number): string;
}

/**
 * {@link DecimalUnitFormatter} provides an implementation of {@link Formatter}
 * that outputs a integers in a standard decimal format with grouped thousands.
 */
class DecimalUnitFormatter extends Formatter {
	private unit: string;
	private numberFormat: Intl.NumberFormat;

	/**
	 * @param unit the unit of the value being formatted.
	 * @constructor
	 */
	constructor(unit: string) {
		super()
		this.unit = unit;
		this.numberFormat = Intl.NumberFormat('en-US', { style: 'decimal' });
	}

	public format(value: number): string {
		return `${this.numberFormat.format(value)} ${this.unit}`
	}
}

/**
 * {@link ScalingUnitFormatter}
 */
abstract class ScalingUnitFormatter extends Formatter {

	private numberFormat: Intl.NumberFormat;

	/**
	 * @param numberFormat An instance of {@link Intl.NumberFormat} to use to
	 * format the scaled value.
	 */
	constructor(numberFormat: Intl.NumberFormat) {
		super();
		this.numberFormat = numberFormat;
	}

	/**
	 * Scales the passed raw value (in a base unit) to an appropriate value for
	 * presentation and returns the scaled value as well as the name of the unit
	 * that the returned value is in.
	 *
	 * @param value the value to be scaled.
	 *
	 * @returns {number,string} an array-like containing the numerical value and
	 * the name of the unit that the value represents.
	 */
	protected abstract scale(value: number): [number, string];

	public format(value: number): string {
		let [scaledValue, scaledUnit] = this.scale(value);
		return `${this.numberFormat.format(scaledValue)} ${scaledUnit}`
	}

}

/**
 * {@link BytesFormatter} formats values that represent a size in bytes as a
 * value in bytes, kilobytes, megabytes, gigabytes, etc.
 */
class BytesFormatter extends ScalingUnitFormatter {

	constructor() {
		super(Intl.NumberFormat('en-US', { style: 'decimal',
										   minimumFractionDigits: 2,
										   maximumFractionDigits: 2 }));
	}

	protected scale(value: number)	: [number, string] {
		let units = ["bytes", "KB", "MB", "GB", "TB", "PB"]
		while (value > 1024 && units.length > 0) {
			value = value / 1024
			units.shift();
		}
		return [value, units[0]];
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
		this.containerEl = containerEl.createSpan({cls: ["obsidian-vault-statistics--item"]});
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

interface VaultMetrics {
	files: number;
	notes: number;
	attachments: number;
	size: number;
	links: number;
	words: number;
}

class VaultMetrics extends Events implements VaultMetrics {

	files: number = 0;
	notes: number = 0;
	attachments: number = 0;
	size: number = 0;
	links: number = 0;
	words: number = 0;

	public reset() {
		this.files = 0;
		this.notes = 0;
		this.attachments = 0;
		this.size = 0;
		this.links = 0;
		this.words = 0;
	}

	public dec(metrics: VaultMetrics) {
		this.files -= metrics?.files || 0;
		this.notes -= metrics?.notes || 0;
		this.attachments -= metrics?.attachments || 0;
		this.size -= metrics?.size || 0;
		this.links -= metrics?.links || 0;
		this.words -= metrics?.words || 0;
		this.trigger("updated");
	}

	public inc(metrics: VaultMetrics) {
		this.files += metrics?.files || 0;
		this.notes += metrics?.notes || 0;
		this.attachments += metrics?.attachments || 0;
		this.size += metrics?.size || 0;
		this.links += metrics?.links || 0;
		this.words += metrics?.words || 0;
		this.trigger("updated");
	}

	public on(name: "updated", callback: (vaultMetrics: VaultMetrics) => any, ctx?: any): EventRef {
		return super.on("updated", callback, ctx);
	}

}

enum FileType {
	Unknown = 0,
	Note,
	Attachment,
}

class FileMetricsCollector {

	private owner: Component;
	private vault: Vault;
    private metadataCache: MetadataCache;
	private data: Map<string, VaultMetrics> = new Map();
	private backlog: Array<string> = new Array();
	private vaultMetrics: VaultMetrics = new VaultMetrics();

	constructor(owner: Plugin) {
		this.owner = owner;
	}

	public setVault(vault: Vault) {
		this.vault = vault;
		return this;
	}

	public setMetadataCache(metadataCache: MetadataCache) {
		this.metadataCache = metadataCache;
		return this;
	}

	public setVaultMetrics(vaultMetrics: VaultMetrics) {
		this.vaultMetrics = vaultMetrics;
		return this;
	}

	public start() {
		this.owner.registerEvent(this.vault.on("create", (file: TFile) => { this.onfilecreated(file) }));
		this.owner.registerEvent(this.vault.on("modify", (file: TFile) => { this.onfilemodified(file) }));
		this.owner.registerEvent(this.vault.on("delete", (file: TFile) => { this.onfiledeleted(file) }));
		this.owner.registerEvent(this.vault.on("rename", (file: TFile, oldPath: string) => { this.onfilerenamed(file, oldPath) }));
		this.owner.registerEvent(this.metadataCache.on("resolve", (file: TFile) => { this.onfilemodified(file) }));
		this.owner.registerEvent(this.metadataCache.on("changed", (file: TFile) => { this.onfilemodified(file) }));

		this.data.clear();
		this.backlog = new Array();
		this.vaultMetrics?.reset();
		this.vault.getFiles().forEach((file: TFile) => {
			if (!(file instanceof TFolder)) {
				this.push(file);
			}
		});
		this.owner.registerInterval(+setInterval(() => { this.processBacklog() }, 2000));

		return this;
	}

	private push(fileOrPath: TFile|string) {
		if (fileOrPath instanceof TFolder) {
			return;
		}

		let path = (fileOrPath instanceof TFile) ? fileOrPath.path : fileOrPath;
		if (!this.backlog.contains(path)) {
			this.backlog.push(path);
		}
	}

	private async processBacklog() {
		while (this.backlog.length > 0) {
			let path = this.backlog.shift();
			// console.log(`processing ${path}`);
			let file = this.vault.getAbstractFileByPath(path) as TFile;
			// console.log(`path = ${path}; file = ${file}`);
			let metrics = await this.collect(file);
			this.update(path, metrics);
		}
		// console.log("done");
	}

	private async onfilecreated(file: TFile) {
		// console.log(`onfilecreated(${file?.path})`);
		this.push(file);
	}

	private async onfilemodified(file: TFile) {
		// console.log(`onfilemodified(${file?.path})`)
		this.push(file);
	}

	private async onfiledeleted(file: TFile) {
		// console.log(`onfiledeleted(${file?.path})`)
		this.push(file);
	}

	private async onfilerenamed(file: TFile, oldPath: string) {
		// console.log(`onfilerenamed(${file?.path})`)
		this.push(file);
		this.push(oldPath);
	}

	private getWordCount(content: string): number {
		// TODO: test edge cases of this method
		// TODO: handle lists, punctuation, bullet points, stop words, ...
		if (content.trim() === "") {
			return 0;
		} else {
			return content.split(/[ ]+/).length;
		}
	}

	private getFileType(file: TFile) : FileType {
		if (file.extension?.toLowerCase() === "md") {
			return FileType.Note;
		} else {
			return FileType.Attachment;
		}
	}

	public async collect(file: TFile): Promise<VaultMetrics> {
		let metadata: CachedMetadata = this.metadataCache.getFileCache(file);

		if (metadata == null) {
			return Promise.resolve(null);
		}

		let metrics = new VaultMetrics();

		switch (this.getFileType(file)) {
			case FileType.Note:
				metrics.files = 1;
				metrics.notes = 1;
				metrics.attachments = 0;
				metrics.size = file.stat?.size;
				metrics.links = metadata?.links?.length || 0;
				metrics.words = 0;
				metrics.words = await this.vault.cachedRead(file).then((content: string) => {
					// Strip frontmatter from the content before calculating the word count
					if (metadata?.frontmatter) {
						let startOffset = metadata.frontmatter.position.start.offset;
						let endOffset = metadata.frontmatter.position.end.offset;
						content = content.substring(0, startOffset) + content.substring(endOffset);
					}

					return this.getWordCount(content);
				}).catch((e) => {
					console.log(`${file.path} ${e}`);
					return 0;
				});
				break;
			case FileType.Attachment:
				metrics.files = 1;
				metrics.notes = 0;
				metrics.attachments = 1;
				metrics.size = file.stat?.size;
				metrics.links = 0;
				metrics.words = 0;
				break;
		}

		return metrics;
	}

	public update(fileOrPath: TFile|string, metrics: VaultMetrics) {
		let key = (fileOrPath instanceof TFile) ? fileOrPath.path : fileOrPath;

		// Remove the existing values for the passed file if present, update the
		// raw values, then add the values for the passed file to the totals.
		this.vaultMetrics?.dec(this.data.get(key));

		if (metrics == null) {
			this.data.delete(key);
		} else {
			this.data.set(key, metrics);
		}

		this.vaultMetrics?.inc(metrics);
	}

}

class StatisticsStatusBarItem {

	private owner: Component;

	// handle of the status bar item to draw into.
	private statusBarItem: HTMLElement;

	// raw stats
	private vaultMetrics: VaultMetrics;

	// index of the currently displayed stat.
	private displayedStatisticIndex = 0;

	private statisticViews: Array<StatisticView> = [];

	constructor (owner: Plugin, statusBarItem: HTMLElement) {
		this.owner = owner;
		this.statusBarItem = statusBarItem;

		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("notes").
			setFormatter((s: VaultMetrics) => {return new DecimalUnitFormatter("notes").format(s.notes)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("attachments").
			setFormatter((s: VaultMetrics) => {return new DecimalUnitFormatter("attachments").format(s.attachments)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("files").
			setFormatter((s: VaultMetrics) => {return new DecimalUnitFormatter("files").format(s.files)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("links").
			setFormatter((s: VaultMetrics) => {return new DecimalUnitFormatter("links").format(s.links)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("words").
			setFormatter((s: VaultMetrics) => {return new DecimalUnitFormatter("words").format(s.words)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("size").
			setFormatter((s: VaultMetrics) => {return new BytesFormatter().format(s.size)}));

		this.statusBarItem.onClickEvent(() => { this.onclick() });
	}

	public setVaultMetrics(vaultMetrics: VaultMetrics) {
		this.vaultMetrics = vaultMetrics;
		this.owner.registerEvent(this.vaultMetrics?.on("updated", this.refreshSoon));
		this.refreshSoon();
		return this;
	}

	private refreshSoon = debounce(() => { this.refresh(); }, 2000, false);

	private refresh() {
		this.statisticViews.forEach((view, i) => {
			view.setActive(this.displayedStatisticIndex == i).refresh(this.vaultMetrics);
		});

		this.statusBarItem.title = this.statisticViews.map(view => view.getText()).join("\n");
	}

	private onclick() {
		this.displayedStatisticIndex = (this.displayedStatisticIndex + 1) % this.statisticViews.length;
		this.refresh();
	}
}
