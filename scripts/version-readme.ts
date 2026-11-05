import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import packageJson from '../package.json' assert { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const version = packageJson.version;

const UNRELEASED_SECTION_TEMPLATE = `### [Unreleased]

- Added
- Changed
- Deprecated
- Removed
- Fixed`;

function extractUnreleasedSection(data: string): string {
  const UNRELEASED_SECTION = /^(### \[Unreleased\].*?)(^###)/sm;
  const match = UNRELEASED_SECTION.exec(data);
  if (match) {
    return match[1];
  }
  throw new Error('Unreleased section not found in README.md');
}

function removeEmptySections(unreleasedSection: string): string {
  let content = unreleasedSection;
  for (const sectionTitle of ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed']) {
    const emptySectionRegex = new RegExp(`^- ${sectionTitle}\\s?\\n(?=^-|\\n)`, 'sm');
    content = content.replace(emptySectionRegex, '');
  }
  return content;
}

function fixUnreleasedSectionVersion(unreleasedSection: string, version: string): string {
  const today = new Date().toISOString().split('T')[0];
  return unreleasedSection.replace(/(### \[Unreleased\])/, `### [${version}] - ${today}`);
}

const readmePath = path.join(__dirname, '../README.md');
const readmeContent = fs.readFileSync(readmePath, 'utf8');

const unreleasedSection = extractUnreleasedSection(readmeContent);

let releaseSection = unreleasedSection;
releaseSection = removeEmptySections(releaseSection);
releaseSection = fixUnreleasedSectionVersion(releaseSection, version);

const newReadmeContent = readmeContent.replace(unreleasedSection, `${UNRELEASED_SECTION_TEMPLATE}\n\n${releaseSection}`);

fs.writeFileSync(readmePath, newReadmeContent, 'utf8');

console.log(`Successfully updated README.md for version ${version}`);
