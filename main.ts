import { App, Plugin } from 'obsidian';

export default class StatisticsPlugin extends Plugin {

	private statusBarItem: StatisticsStatusBarItem = null;

	onload() {
		console.log('Loading vault-statistics Plugin');

		this.statusBarItem = new StatisticsStatusBarItem(this.app, this.addStatusBarItem());

		// create and delete events will clearly change the statistics, hence a shorter timeout.
		this.registerEvent(this.app.vault.on('create', () => { this.statusBarItem.recalculateAndRefresh(100) }));
		this.registerEvent(this.app.vault.on('delete', () => { this.statusBarItem.recalculateAndRefresh(100) }));

		// modifications to files may impact statistics, so update less frequently.
		this.registerEvent(this.app.vault.on('modify', () => { this.statusBarItem.recalculateAndRefresh(2000)}));
	}
}

interface Statistics {
	readonly [index: string] : number;
	notes: number;
	links: number;
	files: number;
	attachments: number;
}

class StatisticsStatusBarItem {
	
	// handle of the application to pull stats from.
	private app: App;

	// handle of the status bar item to draw into.
	private statusBarItem: HTMLElement;

	// window timeout for deferred recalculate and refresh.
	private recalculateAndRefreshTimeout: any;

	// raw stats
	private stats: Statistics = {notes: 0, links: 0, files: 0, attachments: 0};

	// keys of `stats` in the order to cycle through them when the status bar item is clicked.
	private displayedStats: string[] = [ "notes", "links", "files", "attachments"];

	// index of the currently displayed stat.
	private displayedStatIndex = 0;

	constructor (app: App, statusBarItem: HTMLElement) {
		this.app = app;
		this.statusBarItem = statusBarItem;
		this.statusBarItem.onClickEvent(() => {this.onclick()});
	}

	private refresh() {
		let title = [];
		title.push(`${this.stats.notes} notes`);
		title.push(`${this.stats.attachments} attachments`);
		title.push(`${this.stats.files} files`);
		title.push(`${this.stats.links} links`);

		this.statusBarItem.innerText = `${this.stats[this.displayedStats[this.displayedStatIndex]]} ${this.displayedStats[this.displayedStatIndex]}`;
		this.statusBarItem.title = title.join('\n');
	}

	private onclick() {
		this.displayedStatIndex = (this.displayedStatIndex + 1) % this.displayedStats.length;
		this.refresh();
	}

	private recalculate() {
		let stats = {notes: 0, links: 0, files: 0, attachments: 0};
		this.app.vault.getFiles().forEach((f) => {
			stats.files += 1;
			if (f.extension === 'md') {
				stats.notes += 1;
			} else {
				stats.attachments += 1;
			}
			stats.links += this.app.metadataCache.getCache(f.path)?.links?.length || 0;
		});

		this.stats = stats;
	}

	public recalculateAndRefresh(timeout?: number) {
		// If there's an existing timeout it can be cleared since we'll either be
		// deferring it further into the future or performing an immediate refresh
		// which would invalidate the need to refresh again in a short timeframe.
		if (this.recalculateAndRefreshTimeout) {
			window.clearTimeout(this.recalculateAndRefreshTimeout);
		}

		if (timeout) {
			this.recalculateAndRefreshTimeout = window.setTimeout(() => { this.recalculateAndRefresh()}, timeout);
		} else {
			this.recalculate();
			this.refresh();
		}
	}
}


