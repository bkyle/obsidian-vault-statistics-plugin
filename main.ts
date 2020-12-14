import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { clipboard } from 'electron';

export default class CopyBlockRefPlugin extends Plugin {
	onload() {
		this.addCommand({
			id: 'copy-block-ref',
			name: 'Copy Block Reference',
			callback: () => {
				this.copyActiveBlockLinkToClipboard();
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
	}

	generateBlockId() {
		let alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
		let numbers = "0123456789"
		let buffer = "";
		let hasNumeric = false;
		const BLOCK_ID_LENGTH = 6;
		for (let i=0; i<BLOCK_ID_LENGTH; i++) {
			let ch = alphabet[Math.trunc(Math.random() * alphabet.length)];
			if (!isNaN(parseInt(ch))) {
				hasNumeric = true;
			}
			// Ensure that the block id has at least one number in it to prevent
			// the spell checker from treating a block id as a word.
			if (i == BLOCK_ID_LENGTH - 1 && !hasNumeric) {
				ch = numbers[Math.trunc(Math.random() * numbers.length)];
			}
			buffer += ch;
		}
		return buffer;
	}
	
	getActiveBlock() {
		// @ts-ignore
		let editor = this.app.workspace.activeLeaf?.view?.sourceMode?.cmEditor;
		if (!editor) {
			return null;
		}
	
		let {line, ch} = editor.getCursor();
		let activeBlockId = null;
		// @ts-ignore
		let file = this.app.workspace.activeLeaf.view.file.path;
		let blocks = this.app.metadataCache.getCache(file)?.blocks;
		if (blocks) {
			for (let blockId in blocks) {
				let block = blocks[blockId];
				let pos = block?.position;
				if (line >= pos.start.line && ch >= pos.start.col && line <= pos.end.line && ch <= pos.end.col) {
					activeBlockId = blockId;
					break;
				}
			}
		}
	
		if (!activeBlockId) {
			activeBlockId = this.generateBlockId();
			let text = editor.getLine(line);
			editor.replaceRange(text + " ^" + activeBlockId, {line: line, ch:0}, {line: line})
		}
	
		return activeBlockId;
	}
	
	getLinkToActiveBlock() {
		let blockId = this.getActiveBlock();
		// @ts-ignore
		let file = this.app.workspace.activeLeaf.view.file;
		// @ts-ignore
		let path = this.app.workspace.activeLeaf.view.file.path;
		let fileRef =  this.app.metadataCache.fileToLinktext(file, path, true);
		let link = `[[${fileRef}#^${blockId}]]`;
		return link;
	}
	
	copyActiveBlockLinkToClipboard() {
		let link = this.getLinkToActiveBlock();
		if (link) {
			clipboard.writeText(link);
		}
	}

}
