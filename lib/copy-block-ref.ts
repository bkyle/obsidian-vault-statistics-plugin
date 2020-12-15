import { View } from 'obsidian';
import { clipboard } from 'electron';

/**
 * Generates a block id
 */
export function generateBlockId(): string {
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

export function getActiveBlock(view: View): string {
    // @ts-ignore
    let editor = view?.sourceMode?.cmEditor;
    if (!editor) {
        return null;
    }

    let {line, ch} = editor.getCursor();
    let activeBlockId = null;
    // @ts-ignore
    let file = view.file.path;
    let blocks = view.app.metadataCache.getCache(file)?.blocks;
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
        activeBlockId = generateBlockId();
        let text = editor.getLine(line);
        editor.replaceRange(text + " ^" + activeBlockId, {line: line, ch:0}, {line: line})
    }

    return activeBlockId;
}

export function getLinkToActiveBlock(view: View): string {
    let blockId = getActiveBlock(view);
    // @ts-ignore
    let file = view.file;
    // @ts-ignore
    let path = view.file.path;
    let fileRef =  view.app.metadataCache.fileToLinktext(file, path, true);
    let link = `[[${fileRef}#^${blockId}]]`;
    return link;
}

export function copyActiveBlockLinkToClipboard(view: View) {
    let link = getLinkToActiveBlock(view);
    if (link) {
        clipboard.writeText(link);
    }
}
