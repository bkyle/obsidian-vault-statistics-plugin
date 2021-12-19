import { App, Vault, TFile, Plugin, debounce } from 'obsidian';

export default class StatisticsPlugin extends Plugin {

	private statusBarItem: StatisticsStatusBarItem = null;

	update: () => void = debounce(() => { this.statusBarItem.update(); }, 100, true);

	onload() {
		console.log('Loading vault-statistics Plugin');
		this.statusBarItem = new StatisticsStatusBarItem(this.app, this.addStatusBarItem());
		this.registerEvent(this.app.metadataCache.on('resolved', this.update));
		this.update();
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
	private formatter: (s: Statistics) => string;

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
	setFormatter(formatter: (s: Statistics) => string): StatisticView {
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
	refresh(s: Statistics) {
		this.containerEl.setText(this.formatter(s));
	}

	/**
	 * Returns the text content of the view.
	 */
	getText(): string {
		return this.containerEl.getText();
	}
}

interface Statistics {
	readonly [index: string] : number;
	notes: number;
	links: number;
	files: number;
	attachments: number;
	size: number;
}

class VaultMetricsCollector {

	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	// TODO: Refactor from StatisticsManager

}

interface FileMetrics {

}

class FileMetricsCollector {

	private vault: Vault;
	private fileMetrics: Map<TFile, FileMetrics>;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	private updateFileMetrics(file: TFile) {
		// TODO: Collect file-level metrics such as word count and update this.fileMetrics
		// TODO: Handle cases where files are renamed or deleted.
	}
}

class StatisticsManager {

	/** Handle to the application to pull the statistics from. */
	private app: App;

	private statistics: Statistics = {notes: 0, links: 0, files: 0, attachments: 0, size: 0};

	constructor(app: App) {
		this.app = app;
	}

	private update() {
		// TODO: Refactor to use FileMetricsCollector and VaultMetricsCollector
		let statistics = {
			notes: 0,
			links: 0,
			files: 0,
			attachments: 0,
			size: 0
		};
		this.app.vault.getFiles().forEach((f) => {
			statistics.files += 1;
			if (f.extension === 'md') {
				statistics.notes += 1;
			} else {
				statistics.attachments += 1;
			}
			statistics.links += this.app.metadataCache.getCache(f.path)?.links?.length || 0;
			statistics.size += f.stat.size;
		});

		this.statistics = statistics;
	}

}

class StatisticsStatusBarItem {
	
	// handle of the application to pull stats from.
	private app: App;

	// handle of the status bar item to draw into.
	private statusBarItem: HTMLElement;

	// raw stats
	private statistics: Statistics = {notes: 0, links: 0, files: 0, attachments: 0, size: 0};

	// index of the currently displayed stat.
	private displayedStatisticIndex = 0;

	private statisticViews: Array<StatisticView> = [];

	constructor (app: App, statusBarItem: HTMLElement) {
		this.app = app;
		this.statusBarItem = statusBarItem;

		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("notes").
			setFormatter((s: Statistics) => {return new DecimalUnitFormatter("notes").format(s.notes)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("attachments").
			setFormatter((s: Statistics) => {return new DecimalUnitFormatter("attachments").format(s.attachments)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("files").
			setFormatter((s: Statistics) => {return new DecimalUnitFormatter("files").format(s.files)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("links").
			setFormatter((s: Statistics) => {return new DecimalUnitFormatter("links").format(s.links)}));
		this.statisticViews.push(new StatisticView(this.statusBarItem).
			setStatisticName("size").
			setFormatter((s: Statistics) => {return new BytesFormatter().format(s.size)}));

		this.statusBarItem.onClickEvent(() => {this.onclick()});
	}

	private refresh() {
		this.statisticViews.forEach((view, i) => {
			view.setActive(this.displayedStatisticIndex == i).refresh(this.statistics);
		});

		this.statusBarItem.title = this.statisticViews.map(view => view.getText()).join("\n");
	}

	private onclick() {
		this.displayedStatisticIndex = (this.displayedStatisticIndex + 1) % this.statisticViews.length;
		this.refresh();
	}

	public update() {
		// TODO: Use StatisticsManager to collect statistics
		let statistics = {notes: 0, links: 0, files: 0, attachments: 0, size: 0};
		this.app.vault.getFiles().forEach((f) => {
			statistics.files += 1;
			if (f.extension === 'md') {
				statistics.notes += 1;
			} else {
				statistics.attachments += 1;
			}
			statistics.links += this.app.metadataCache.getCache(f.path)?.links?.length || 0;
			statistics.size += f.stat.size;
		});

		this.statistics = statistics;
		this.refresh();
	}
}
