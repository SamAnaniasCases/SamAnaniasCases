const fs = require('fs');
const https = require('https');

const username = 'SamAnaniasCases';
const defaultBuilding = '[BITS](https://github.com/SamAnaniasCases) — A modern biometric time tracking and attendance web portal featuring high-performance React frontends and containerized deployment workflows.';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'node.js-script'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getCurrentlyBuilding() {
  try {
    const events = await fetchJson(`https://api.github.com/users/${username}/events/public`);
    if (!Array.isArray(events) || events.length === 0) {
      return defaultBuilding;
    }
    const pushEvent = events.find(event => event.type === 'PushEvent');
    if (!pushEvent) {
      return defaultBuilding;
    }
    const repoName = pushEvent.repo.name;
    const repoInfo = await fetchJson(`https://api.github.com/repos/${repoName}`);
    const repoDisplayName = repoName.split('/')[1] || repoName;
    const description = repoInfo.description || 'A project in active development.';
    return `[${repoDisplayName}](https://github.com/${repoName}) — ${description}`;
  } catch (err) {
    console.error('Error fetching currently building:', err);
    return defaultBuilding;
  }
}

async function main() {
  const readmePath = 'README.md';
  let readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  const buildingText = await getCurrentlyBuilding();
  console.log('Currently Building set to:', buildingText);
  
  const regex = /(<!--START_SECTION:currently_building-->)([\s\S]*?)(<!--END_SECTION:currently_building-->)/g;
  readmeContent = readmeContent.replace(regex, `$1${buildingText}$3`);
  
  fs.writeFileSync(readmePath, readmeContent, 'utf8');
}

main();
