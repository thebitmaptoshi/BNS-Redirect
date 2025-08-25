const DATABASE_URL = 'https://raw.githubusercontent.com/Zmakin/BNS/main/BNS%20registry.txt';

// Function to sanitize query
function sanitizeQuery(query) {
  return query.replace(/[^a-zA-Z0-9-\.]/g, '').toLowerCase();
}

// Function to fetch and parse database
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

// Process the redirect
(async () => {
  const params = new URLSearchParams(window.location.search);
  let query = params.get('query');
  if (!query) {
    // Fallback: Try to extract from referrer or current URL
    const referrer = document.referrer;
    const url = referrer || window.location.href;
    const match = url.match(/:\/\/([^\/]+)\.bitmap/);
    query = match ? match[1] : '';
  }

  if (!query) {
    window.location.href = chrome.runtime.getURL(`error.html?query=unknown`);
    return;
  }

  const sanitizedQuery = sanitizeQuery(query);
  const mappings = await fetchDatabase();
  if (!mappings) {
    window.location.href = chrome.runtime.getURL(`error.html?query=${encodeURIComponent(sanitizedQuery)}`);
    return;
  }

  const inscriptionId = mappings[sanitizedQuery];
  if (inscriptionId) {
    window.location.href = `https://ordinals.com/content/${inscriptionId}`;
  } else {
    window.location.href = chrome.runtime.getURL(`error.html?query=${encodeURIComponent(sanitizedQuery)}`);
  }
})();