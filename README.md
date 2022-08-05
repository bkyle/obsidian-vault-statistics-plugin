# Obsidian Vault Statistics Plugin

Status bar item with vault statistics including the number of notes, files, attachments, and links.

## Usage

After the plugin is installed and enabled you will see a new item appear in the status bar showing you the number of notes in your vault.

- Click on the status bar item to cycle through the available statistics.
- Hover over the status bar item to see all of the available statistics.

## Advanced Usage

### Showing All Statistics

All statistics can be shown by creating and enabling a CSS snippet with the following content.

```css
/* Show all vault statistics. */
.obsidian-vault-statistics--item {
    display: initial !important;
}
```

### Showing Selected Statistics

Similarly to the above, one can show certain statistics using a similar method to the above.  Below is a snippet that hides all by the notes and attachments statistics.  The snippet can be modified to include more or different statistics.

``` css
/* Hide all statistics. */
.obsidian-vault-statistics--item {
    display: none !important;
}

/* Always show the notes and attachments statistics. */
.obsidian-vault-statistics--item-notes,
.obsidian-vault-statistics--item-attachments {
    display: initial !important;
}
```

## Building

Install the required modules:

```sh
npm install
```

Run tests using the `test` script:

```sh
npm run test
```

Build `main.js` by running the `build`  script:

```sh
npm run build
```

Install the plugin into a vault by running the `deploy` script.  This script requires that the `PLUGIN_DIR` environment variable be set to the absolute path to the directory in your vault's plugins directory that the plugin should be copied into, e.g. `~/Notes/.obsidian/plugins/obsidian-vault-statistics-plugin`.

```sh
PLUGIN_DIR=... npm run deploy
```

or

```sh
export PLUGIN_DIR=...
npm run deploy
```

After installing the plugin, toggle the plugin on and off in settings or reload your vault to test changes.

The process of testing, building, and installing has been automated with the `dev` script which will perform these actions when there are changes to source files.

```sh
PLUGIN_DIR=... npm run dev
```

## Version History

### 0.1.1

- Fixed issue when processing files with admonitions (#12)

### 0.1.0

- Added word count metric (#8)

### 0.0.8

- Initial support for displaying multiple statistics at the same time. (#6)

### 0.0.6

- FIXED: Reported values only contain 2 significant digits (#7)

### 0.0.5

- Displayed statistics are formatted with grouping for increase readability.
- Added Vault Size statistic which calculates the total size of all files in the vault that are understood by Obsidian  The display value is scaled to the appropriate unit.  (#5)

### 0.0.4

- Statistics will be calculated automatically as soon as the plugin loads.

