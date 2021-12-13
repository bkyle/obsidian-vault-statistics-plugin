import { App, Plugin, debounce } from 'obsidian';

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

class DecimalUnitFormatter extends Formatter {
	private unit: string;
	private numberFormat: Intl.NumberFormat;

	constructor(unit: string) {
		super()
		this.unit = unit;
		this.numberFormat = Intl.NumberFormat('en-US', { style: 'decimal',
														 minimumSignificantDigits: 2,
														 maximumSignificantDigits: 2 });
	}

	public format(value: number): string {
		return `${this.numberFormat.format(value)} ${this.unit}`
	}
}

abstract class ScalingUnitFormatter extends Formatter {

	private numberFormat: Intl.NumberFormat;

	constructor(numberFormat: Intl.NumberFormat) {
		super();
		this.numberFormat = numberFormat;
	}

	protected abstract scale(value: number): [number, string];

	public format(value: number): string {
		let [scaledValue, scaledUnit] = this.scale(value);
		return `${this.numberFormat.format(scaledValue)} ${scaledUnit}`
	}

}

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

interface Statistics {
	readonly [index: string] : number;
	notes: number;
	links: number;
	files: number;
	attachments: number;
	size: number;
}

class StatisticView {

	private containerEl: HTMLElement;
	private formatter: (s: Statistics) => string;

	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl.createSpan({cls: ["obsidian-vault-statistics--item"]});
		this.setActive(false);
	}

	setStatisticName(name: string): StatisticView {
		this.containerEl.addClass(`obsidian-vault-statistics--item-${name}`);
		return this;
	}

	setFormatter(formatter: (s: Statistics) => string): StatisticView {
		this.formatter = formatter;
		return this;
	}

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

	refresh(s: Statistics) {
		this.containerEl.setText(this.formatter(s));
	}

	getText(): string {
		return this.containerEl.getText();
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
