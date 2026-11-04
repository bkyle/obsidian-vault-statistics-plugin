const fs = require('fs');
const path = require('path');
const moment = require('moment');

const version = require('../package.json').version;

const UNRELEASED_SECTION_TEMPLATE = `### [Unreleased]

- Added
- Changed
- Deprecated
- Removed
- Fixed`

function extractUnreleasedSection(data) {
  const UNRELEASED_SECTION = /^(### \[Unreleased\].*?)(^###)/sm;
    let match = UNRELEASED_SECTION.exec(data);
    if (match) {
        return match[1];
    }
    throw new Error('Unreleased section not found in README.md');
}

function removeEmptySections(unreleasedSection) {
    for (let sectionTitle of ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed']) {
        let emptySectionRegex = new RegExp(`^- ${sectionTitle}\\s?\\n(?=^-|\\n)`, 'sm');
        unreleasedSection = unreleasedSection.replace(emptySectionRegex, '');
    }
    return unreleasedSection;
}

function fixUnreleasedSectionVersion(unreleasedSection, version) {
    let today = moment().format('YYYY-MM-DD');
    return unreleasedSection.replace(/(### \[Unreleased\])/, `### [${version}] - ${today}`);
}

let readmePath = path.join(__dirname, '../README.md');
var readmeContent = fs.readFileSync(readmePath, 'utf8');

let unreleasedSection = extractUnreleasedSection(readmeContent);

var releaseSection = unreleasedSection
releaseSection = removeEmptySections(releaseSection);
releaseSection = fixUnreleasedSectionVersion(releaseSection, version);

readmeContent = readmeContent.replace(unreleasedSection, UNRELEASED_SECTION_TEMPLATE + "\n\n" + releaseSection);

fs.writeFileSync(readmePath, readmeContent, 'utf8');
