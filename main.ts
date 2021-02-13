import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TAbstractFile } from 'obsidian';
import { clipboard } from 'electron';
import { copyActiveBlockLinkToClipboard } from 'lib/copy-block-ref';


export default class KitchenSinkPlugin extends Plugin {

	private statusBarItem: HTMLElement = null;

	onload() {
		console.log('Loading obsidian-kitchen-sink-plugin');
		this.addCommand({
			id: 'copy-block-ref',
			name: 'Copy Block Reference',
			callback: () => {
				copyActiveBlockLinkToClipboard(this.app.workspace.activeLeaf.view);
			},
			// checkCallback: (checking: boolean) => {
			// 	let leaf = this.app.workspace.activeLeaf;
			// 	if (leaf) {
			// 		if (!checking) {
			// 			new SampleModal(this.app).open();
			// 		}
			// 		return true;
			// 	}
			// 	return false;
			// }
		});

		// console.log("Registering modify event handler");
		// this.registerEvent(this.app.vault.on('modify', (file: TAbstractFile) => {
		// 	console.log(`${file.name} modified`);
		// }));
		
		// ['modify', 'create', 'closed', 'delete', 'rename'].forEach((event) => {
		// 	this.handle(this.app.vault, event, (f: TAbstractFile) => {
		// 		console.log(`received ${event}: TAbstractFile(path: '${f.path}', name: '${f.name}')`);
		// 	});
		// });
		

		this.statusBarItem = this.addStatusBarItem();
		this.update();
		this.registerInterval(window.setInterval(() => {this.update()}, 5000));
	}

	private calculateStatistics() {
		let stats = { files: 0, notes: 0, attachments: 0, links: 0};
		this.app.vault.getFiles().forEach((f) => {
			stats.files += 1;
			if (f.extension === 'md') {
				stats.notes += 1;
			} else {
				stats.attachments += 1;
			}
			stats.links += this.app.metadataCache.getCache(f.path)?.links?.length || 0;
		});
		return stats;
	}

	private update() {
		let stats = this.calculateStatistics();

		let title = [];
		title.push(`${stats.notes} notes`);
		title.push(`${stats.attachments} attachments`);
		title.push(`${stats.files} files`);
		title.push(`${stats.links} links`);

		this.statusBarItem.innerText = `${stats.notes} notes`;
		this.statusBarItem.title = title.join('\n');

	}

	// private handle(obj: any, event: string, handleFn?: (o: any) => any) {
	// 	if (!handleFn) {
	// 		handleFn = function(o: any) {
	// 			console.log(`received ${event}: ${typeof o}`);
	// 		}
	// 	}
	// 	console.log(`registering ${event} handler`);
	// 	this.registerEvent(obj.on(event, handleFn));
	// }

}
