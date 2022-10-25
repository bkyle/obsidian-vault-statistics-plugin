import { Component, Vault, MetadataCache, TFile, TFolder, CachedMetadata } from 'obsidian';
import { VaultMetrics } from './metrics';
import { MARKDOWN_TOKENIZER, UNIT_TOKENIZER } from './text';


enum FileType {
  Unknown = 0,
  Note,
  Attachment,
}

export class VaultMetricsCollector {

  private owner: Component;
  private vault: Vault;
  private metadataCache: MetadataCache;
  private data: Map<string, VaultMetrics> = new Map();
  private backlog: Array<string> = new Array();
  private vaultMetrics: VaultMetrics = new VaultMetrics();

  constructor(owner: Component) {
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

  private push(fileOrPath: TFile | string) {
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

  private getFileType(file: TFile): FileType {
    if (file.extension?.toLowerCase() === "md") {
      return FileType.Note;
    } else {
      return FileType.Attachment;
    }
  }

  public async collect(file: TFile): Promise<VaultMetrics> {
    let metadata: CachedMetadata;
    try {
      metadata = this.metadataCache.getFileCache(file);
    } catch (e) {
      // getFileCache indicates that it should return either an instance
      // of CachedMetadata or null.  The conditions under which a null 
      // is returned are unspecified.  Empirically, if the file does not
      // exist, e.g. it's been deleted or renamed then getFileCache will 
      // throw an exception instead of returning null.
      metadata = null;
    }

    if (metadata == null) {
      return Promise.resolve(null);
    }

    switch (this.getFileType(file)) {
      case FileType.Note:
        return new NoteMetricsCollector(this.vault).collect(file, metadata);
      case FileType.Attachment:
        return new FileMetricsCollector().collect(file, metadata);
    }
  }

  public update(fileOrPath: TFile | string, metrics: VaultMetrics) {
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

class NoteMetricsCollector {

  static TOKENIZERS = new Map([
    ["paragraph", MARKDOWN_TOKENIZER],
    ["heading", MARKDOWN_TOKENIZER],
    ["list", MARKDOWN_TOKENIZER],
    ["table", UNIT_TOKENIZER],
    ["yaml", UNIT_TOKENIZER],
    ["code", UNIT_TOKENIZER],
    ["blockquote", MARKDOWN_TOKENIZER],
    ["math", UNIT_TOKENIZER],
    ["thematicBreak", UNIT_TOKENIZER],
    ["html", UNIT_TOKENIZER],
    ["text", UNIT_TOKENIZER],
    ["element", UNIT_TOKENIZER],
    ["footnoteDefinition", UNIT_TOKENIZER],
    ["definition", UNIT_TOKENIZER],
    ["callout", MARKDOWN_TOKENIZER],
  ]);

  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  public async collect(file: TFile, metadata: CachedMetadata): Promise<VaultMetrics> {
    let metrics = new VaultMetrics();

    metrics.files = 1;
    metrics.notes = 1;
    metrics.attachments = 0;
    metrics.size = file.stat?.size;
    metrics.links = metadata?.links?.length || 0;
    metrics.words = 0;
    metrics.words = await this.vault.cachedRead(file).then((content: string) => {
      return metadata.sections?.map(section => {
        const sectionType = section.type;
        const startOffset = section.position?.start?.offset;
        const endOffset = section.position?.end?.offset;
        const tokenizer = NoteMetricsCollector.TOKENIZERS.get(sectionType);
        if (!tokenizer) {
          console.log(`${file.path}: no tokenizer, section.type=${section.type}`);
          return 0;
        } else {
          const tokens = tokenizer.tokenize(content.substring(startOffset, endOffset));
          return tokens.length;
        }
      }).reduce((a, b) => a + b, 0);
    }).catch((e) => {
      console.log(`${file.path} ${e}`);
      return 0;
    });

    return metrics;
  }
}

class FileMetricsCollector {

  public async collect(file: TFile, metadata: CachedMetadata): Promise<VaultMetrics> {
    let metrics = new VaultMetrics();
    metrics.files = 1;
    metrics.notes = 0;
    metrics.attachments = 1;
    metrics.size = file.stat?.size;
    metrics.links = 0;
    metrics.words = 0;
    return metrics;
  }
}
