// Database URL
const DATABASE_URL = 'https://raw.githubusercontent.com/Zmakin/BNS/main/BNS%20registry.txt';

// Function to sanitize query
function sanitizeQuery(query) {
  return query.replace(/[^a-zA-Z0-9-\.]/g, '').toLowerCase();
}

// Function to fetch and parse database (for background use)
async function fetchDatabase() {
  try {
    const response = await fetch(DATABASE_URL);
    if (!response.ok) {
      console.error('Failed to fetch database:', response.status);
      return null;
    }
    const text = await response.text();
    // Split on commas between parenthesized entries and clean up
    const entries = text.replace(/^\(|\)$/g, '').split('),(').map(entry => entry.trim()).filter(entry => entry);
    const mappings = {};

    for (const entry of entries) {
      const match = entry.match(/^([^,]+),([^,]+),(.+)$/);
      if (!match) continue;

      const [, name, address, inscriptionId] = match;
      const sanitizedName = sanitizeQuery(name);
      const sanitizedAddress = sanitizeQuery(address);
      const cleanInscriptionId = inscriptionId.trim().replace(/\)$/, '');

      if (sanitizedName && sanitizedAddress && cleanInscriptionId) {
        mappings[sanitizedName] = cleanInscriptionId;
        mappings[sanitizedAddress] = cleanInscriptionId;
      }
    }

    return mappings;
  } catch (error) {
    console.error('Error fetching database:', error);
    return null;
  }
}

// Update declarativeNetRequest rules
async function updateRules() {
  const mappings = await fetchDatabase();
  if (!mappings) {
    console.error('No mappings available, skipping rule update');
    return;
  }

  // Clear existing rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(rule => rule.id)
  });

  // Create a single rule to redirect all .bitmap URLs to redirect.html
  const rules = [{
    id: 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        regexSubstitution: chrome.runtime.getURL('redirect.html?query=\\1')
      }
    },
    condition: {
      regexFilter: '^https?://([^/]+)\\.bitmap(/|$)',
      resourceTypes: ['main_frame']
    }
  }];

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });
    console.log('Updated declarativeNetRequest rules');
  } catch (error) {
    console.error('Failed to update rules:', error);
  }
}

// Handle raw .bitmap navigations
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  const rawUrl = details.url.toLowerCase();
  // Check for raw .bitmap inputs or search-like inputs
  const queryMatch = rawUrl.match(/^([^:/?#]+)\.bitmap(?:[?/#].*)?$/);
  const searchMatch = rawUrl.match(/[?&]q=([^&]*)\.bitmap(?:[&#].*)?$/);
  const query = queryMatch ? queryMatch[1] : (searchMatch ? decodeURIComponent(searchMatch[1]) : '');

  if (!query) {
    console.log('No valid .bitmap query found in:', rawUrl);
    return; // Let browser handle non-.bitmap or invalid inputs
  }

  console.log('Intercepted .bitmap navigation:', query);
  // Redirect to redirect.html with query
  chrome.tabs.update(details.tabId, { url: chrome.runtime.getURL(`redirect.html?query=${encodeURIComponent(query)}`) });
}, { url: [{ urlMatches: '^[^:/?#]+\\.bitmap.*$' }, { urlMatches: '.*[?&]q=[^&]*\\.bitmap.*$' }] });

// Initialize on startup
updateRules();

// Refresh rules periodically (every 5 minutes)
setInterval(updateRules, 5 * 60 * 1000);