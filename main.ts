import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile } from 'obsidian';
import { clipboard } from 'electron';
import { copyActiveBlockLinkToClipboard } from 'lib/copy-block-ref';


export default class KitchenSinkPlugin extends Plugin {
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

		console.log("Registering modify event handler");
		this.registerEvent(this.app.vault.on('modify', (file: TAbstractFile) => {
			console.log(`${file.name} modified`);
		}));
	}
}
