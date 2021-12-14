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
		this.numberFormat = Intl.NumberFormat('en-US', { style: 'decimal' });
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

class StatisticsStatusBarItem {
	
	// handle of the application to pull stats from.
	private app: App;

	// handle of the status bar item to draw into.
	private statusBarItem: HTMLElement;

	// raw stats
	private statistics: Statistics = {notes: 0, links: 0, files: 0, attachments: 0, size: 0};

	private formatters = [(s: Statistics) => {return new DecimalUnitFormatter("notes").format(s.notes)},
						  (s: Statistics) => {return new DecimalUnitFormatter("attachments").format(s.attachments)},
						  (s: Statistics) => {return new DecimalUnitFormatter("files").format(s.files)},
						  (s: Statistics) => {return new DecimalUnitFormatter("links").format(s.links)},
						  (s: Statistics) => {return new BytesFormatter().format(s.size)}];

	// index of the currently displayed stat.
	private displayedStatisticIndex = 0;

	constructor (app: App, statusBarItem: HTMLElement) {
		this.app = app;
		this.statusBarItem = statusBarItem;
		this.statusBarItem.onClickEvent(() => {this.onclick()});
	}

	private refresh() {
		let formattedStatistics: Array<string> = [];
		this.formatters.forEach(formatter => formattedStatistics.push(formatter(this.statistics)));
		this.statusBarItem.innerText = formattedStatistics[this.displayedStatisticIndex];
		this.statusBarItem.title = formattedStatistics.join('\n');
	}

	private onclick() {
		this.displayedStatisticIndex = (this.displayedStatisticIndex + 1) % this.formatters.length;
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
