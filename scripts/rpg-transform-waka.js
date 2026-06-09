/**
 * Post-processes the WakaTime section in README.md
 * to replace generic descriptions with RPG-themed text.
 */
const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '..', 'README.md');

const replacements = [
  // Section headers
  ['📊 **This Week I Spent My Time On**', '📊 **This Week\'s Training Log**'],

  // Time of day
  ["**I'm an Early 🐤**", "**I'm a Dawn Warrior 🌅**"],
  ["**I'm a Night 🦉**", "**I'm a Shadow Stalker 🌙**"],

  // Most productive day
  ['📅 **I\'m Most Productive on', '📅 **Peak Grinding Day:'],

  // Subcategories
  ['💬 Programming Languages:', '🔮 Spell Schools:'],
  ['🔥 Editors:', '⚔️ Weapons of Choice:'],
  ['🐱‍💻 Projects:', '📜 Active Quests:'],
  ['💻 Operating System:', '🛡️ Battle Platform:'],

  // Badge labels
  ['Code%20Time', 'Grind%20Time'],
  ['From%20Hello%20World%20I%27ve%20Written', 'Scrolls%20Written'],

  // Progress bar characters — sleek diamond blocks
  ['█', '▰'],
  ['░', '▱'],
];

let readme = fs.readFileSync(README_PATH, 'utf8');

// Extract waka section
const startMarker = '<!--START_SECTION:waka-->';
const endMarker = '<!--END_SECTION:waka-->';

const startIdx = readme.indexOf(startMarker);
const endIdx = readme.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('⚠️ WakaTime section markers not found in README.md');
  process.exit(0);
}

// Only replace within the waka section
let wakaSection = readme.substring(startIdx, endIdx + endMarker.length);

for (const [search, replace] of replacements) {
  wakaSection = wakaSection.split(search).join(replace);
}

// Transform Time-of-Day and Day-of-Week stats into a two-column HTML layout
const timeOfDayRegex = /(\*\*I'm (?:an Early|a Night|a Dawn Warrior|a Shadow Stalker)[^*]*\*\*[\s\S]*?```[\s\S]*?```)/gi;
const peakDayRegex = /(📅 \*\*(?:Peak Grinding Day|I'm Most Productive on)[^*]*\*\*[\s\S]*?```[\s\S]*?```)/gi;

const timeOfDayMatch = wakaSection.match(timeOfDayRegex);
const peakDayMatch = wakaSection.match(peakDayRegex);

if (timeOfDayMatch && peakDayMatch) {
  const timeBlock = timeOfDayMatch[0].trim();
  const dayBlock = peakDayMatch[0].trim();

  const twoColumnTable = `
<table>
  <tr>
    <td valign="top" width="50%">

${timeBlock}

    </td>
    <td valign="top" width="50%">

${dayBlock}

    </td>
  </tr>
</table>
`;

  const timeIdx = wakaSection.indexOf(timeBlock);
  const dayIdx = wakaSection.indexOf(dayBlock);

  if (timeIdx !== -1 && dayIdx !== -1) {
    if (timeIdx < dayIdx) {
      wakaSection = wakaSection.substring(0, timeIdx) + twoColumnTable.trim() + '\n\n' + wakaSection.substring(dayIdx + dayBlock.length);
    } else {
      wakaSection = wakaSection.substring(0, dayIdx) + twoColumnTable.trim() + '\n\n' + wakaSection.substring(timeIdx + timeBlock.length);
    }
  }
}

readme = readme.substring(0, startIdx) + wakaSection + readme.substring(endIdx + endMarker.length);

fs.writeFileSync(README_PATH, readme, 'utf8');
console.log('✅ WakaTime section transformed to RPG theme!');
