# Contributor's Guide

## Quick Start

```sh
npm install
npm run test
npm run build
npm run deploy
```

## Requirements

- nodejs (>= v18.10.0)
- npm (>= 8.19.2)

## Getting Started

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

Install the plugin into a vault by running the `deploy` script.  This script will copy the plugin into the directory specified in the `PLUGIN_DIR` environment variable.  `PLUGIN_DIR` is expected to be set to the absolute path of the directory to copy the plugin into.  This directory will be created if it doesn't already exist.  `PLUGIN_DIR` defaults to `.sandbox/.obsidian/plugins/vault-statistics-plugin`.  See the [[Sandbox Vault]] section below for more information.

To use the default sandbox vault:

```sh
npm run deploy
```

Alternatively you can specify a `PLUGIN_DIR` to use for the `deploy` script:

```sh
PLUGIN_DIR=... npm run deploy
```

or

```sh
export PLUGIN_DIR=...
npm run deploy
```

After installing the plugin, toggle the plugin on and off in settings or reload your vault to test changes.

## Automating Build and Deploy

The `watch` script will watch for changes to source files.  When changes are detected the `test`, `build`, and `deploy` scripts are run.

```sh
PLUGIN_DIR=... npm run watch
```

## Sandbox Vault

The `.sandbox` directory in this repository is a bare-bones vault intended to be used as a sandbox for interactive testing.