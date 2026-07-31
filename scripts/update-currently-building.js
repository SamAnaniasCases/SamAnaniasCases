const fs = require('fs');
const https = require('https');

const username = 'SamAnaniasCases';
const activeLimit = 2; // Shows top N active quests
const inactiveLimit = 3; // Shows top N inactive quests (limited to at most 3)

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'node.js-script'
      }
    };
    if (process.env.GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Request failed with status code ${res.statusCode}`));
            return;
          }
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function extractRepos(sectionContent) {
  const repos = [];
  const lines = sectionContent.split('\n');
  for (const line of lines) {
    // Try HTML first: <b><a href="URL">DisplayName</a></b> — Description
    const htmlMatch = line.match(/<a\s+href="([^"]+)">([^<]+)<\/a><\/b>\s*—\s*([^\r\n<]+)/);
    if (htmlMatch) {
      repos.push({
        displayName: htmlMatch[2].trim(),
        url: htmlMatch[1].trim(),
        description: htmlMatch[3].trim()
      });
      continue;
    }
    // Try Markdown: **[DisplayName](URL)** — Description or [DisplayName](URL) — Description
    const mdMatch = line.match(/\*?\*?\[([^\]]+)\]\((https:\/\/github\.com\/[^\/\s\)]+\/?[^\/\s\)]*)\)\*?\*?\s*—\s*([^\r\n<]+)/);
    if (mdMatch) {
      repos.push({
        displayName: mdMatch[1].trim(),
        url: mdMatch[2].trim(),
        description: mdMatch[3].trim()
      });
    }
  }
  return repos;
}

function isProfileRepo(repoIdentifier) {
  if (!repoIdentifier) return false;
  const str = repoIdentifier.toLowerCase().trim().replace(/\/$/, '');
  const uname = username.toLowerCase();
  return (
    str === uname ||
    str === `${uname}/${uname}` ||
    str.endsWith(`/${uname}`) ||
    str.endsWith(`github.com/${uname}/${uname}`)
  );
}

async function main() {
  const readmePath = 'README.md';
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // 1. Fetch active repositories from API
  const activeRepoNames = [];
  try {
    const events = await fetchJson(`https://api.github.com/users/${username}/events/public`);
    if (Array.isArray(events)) {
      const pushEvents = events.filter(event => event.type === 'PushEvent');
      const filteredEvents = pushEvents.filter(event => !isProfileRepo(event.repo.name));
      activeRepoNames.push(...new Set(filteredEvents.map(event => event.repo.name)));
    }
  } catch (err) {
    console.error('Error fetching API events:', err.message);
  }

  // 2. Fetch repo details for top API active repos to ensure descriptions are fresh
  const apiRepos = [];
  // We limit to top 5 unique repos to prevent API rate limits
  for (const repoName of activeRepoNames.slice(0, 5)) {
    try {
      const repoInfo = await fetchJson(`https://api.github.com/repos/${repoName}`);
      if (repoInfo && repoInfo.html_url) {
        const repoDisplayName = repoInfo.name || repoName.split('/')[1] || repoName;
        const description = repoInfo.description || 'A project in active development.';
        apiRepos.push({
          displayName: repoDisplayName,
          url: repoInfo.html_url,
          description: description
        });
      }
    } catch (err) {
      console.error(`Error fetching repo details for ${repoName}:`, err.message);
    }
  }

  // 3. Extract current repositories from README sections
  const activeRegex = /(<!--START_SECTION:active_quests-->)([\s\S]*?)(<!--END_SECTION:active_quests-->)/;
  const inactiveRegex = /(<!--START_SECTION:inactive_quests-->)([\s\S]*?)(<!--END_SECTION:inactive_quests-->)/;

  const oldActiveMatch = readmeContent.match(activeRegex);
  const oldInactiveMatch = readmeContent.match(inactiveRegex);

  const oldActiveContent = oldActiveMatch ? oldActiveMatch[2] : '';
  const oldInactiveContent = oldInactiveMatch ? oldInactiveMatch[2] : '';

  const oldActiveRepos = extractRepos(oldActiveContent);
  const oldInactiveRepos = extractRepos(oldInactiveContent);

  // Ensure self profile repository is not kept in active quests
  const cleanOldActiveRepos = [];
  oldActiveRepos.forEach(repo => {
    if (isProfileRepo(repo.displayName) || isProfileRepo(repo.url)) {
      oldInactiveRepos.push(repo);
    } else {
      cleanOldActiveRepos.push(repo);
    }
  });

  // 4. Merge uniquely while preserving order of activity:
  // API repos (most recent) -> Old Active repos -> Old Inactive repos
  const allReposMap = new Map();

  function addRepo(repo) {
    const normalizedUrl = repo.url.toLowerCase().trim().replace(/\/$/, "");
    if (!allReposMap.has(normalizedUrl)) {
      allReposMap.set(normalizedUrl, repo);
    }
  }

  apiRepos.forEach(addRepo);
  cleanOldActiveRepos.forEach(addRepo);
  oldInactiveRepos.forEach(addRepo);

  const allMergedRepos = Array.from(allReposMap.values());

  // Fallback if everything is empty
  if (allMergedRepos.length === 0) {
    allMergedRepos.push({
      displayName: 'BITS (Biometric Integrated Timekeeping System)',
      url: `https://github.com/${username}`,
      description: 'A modern biometric time tracking and attendance web portal featuring high-performance React frontends and containerized deployment workflows.'
    });
  }

  // 5. Partition into Active and Inactive (limited to at most 3)
  const activeList = allMergedRepos.slice(0, activeLimit);
  const inactiveList = allMergedRepos.slice(activeLimit, activeLimit + inactiveLimit);

  // 6. Format formatted lines as list items for clean GitHub rendering
  const activeLines = activeList.map(repo => {
    return `<li><b><a href="${repo.url}">${repo.displayName}</a></b> — ${repo.description}</li>`;
  }).join('\n');

  const inactiveLines = inactiveList.length > 0
    ? inactiveList.map(repo => {
        return `<li><b><a href="${repo.url}">${repo.displayName}</a></b> — ${repo.description}</li>`;
      }).join('\n')
    : '<li><i>No inactive quests in this log yet.</i></li>';

  // 7. Write back to README
  readmeContent = readmeContent.replace(activeRegex, `$1\n${activeLines}\n$3`);
  readmeContent = readmeContent.replace(inactiveRegex, `$1\n${inactiveLines}\n$3`);

  fs.writeFileSync(readmePath, readmeContent, 'utf8');
  console.log(`Successfully updated Quests! Active: ${activeList.length}, Inactive: ${inactiveList.length}`);
}

main();
