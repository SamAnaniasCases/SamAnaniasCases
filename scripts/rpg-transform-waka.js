/**
 * Post-processes the WakaTime section in README.md
 * to replace generic descriptions with RPG-themed text.
 */
const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '..', 'README.md');

const replacements = [
  // Section headers
  ['**🐱 My GitHub Data**', '**⚔️ Guild Registry**'],
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

  // Storage & stats
  ['📦 16', '📦 Inventory: 16'],
  ['🏆', '🏆 Quests Completed:'],
  ['🚫 Not Opted to Hire', '🚫 Not Seeking Party Members'],
  ['📜 4 Public Repositories', '📜 4 Public Dungeons'],
  ['📜 3 Public Repositories', '📜 3 Public Dungeons'],
  ['📜 5 Public Repositories', '📜 5 Public Dungeons'],
  ['🔑 5 Private Repositories', '🔑 5 Hidden Vaults'],
  ['🔑 4 Private Repositories', '🔑 4 Hidden Vaults'],
  ['🔑 3 Private Repositories', '🔑 3 Hidden Vaults'],

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

// Handle dynamic public/private repo counts with regex
wakaSection = wakaSection.replace(/📜 (\d+) Public Repositories/g, '📜 $1 Public Dungeons');
wakaSection = wakaSection.replace(/🔑 (\d+) Private Repositories/g, '🔑 $1 Hidden Vaults');
wakaSection = wakaSection.replace(/📦 ([\d.]+\s*\w+) Used in GitHub's Storage/g, '📦 Inventory: $1 Used');
wakaSection = wakaSection.replace(/🏆 (\d+) Contributions in the Year (\d+)/g, '🏆 $1 Quests Completed in Year $2');

readme = readme.substring(0, startIdx) + wakaSection + readme.substring(endIdx + endMarker.length);

fs.writeFileSync(README_PATH, readme, 'utf8');
console.log('✅ WakaTime section transformed to RPG theme!');
