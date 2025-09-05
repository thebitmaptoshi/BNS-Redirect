const REGISTRY_BASE_URL = 'https://raw.githubusercontent.com/thebitmaptoshi/BNS/main/Registry/';

// Function to sanitize query
function sanitizeQuery(query) {
  // Allow a-z, A-Z, 0-9, period, dash, underscore, exclamation, equals
  return query.replace(/[^a-zA-Z0-9.\-_=!]/g, '').toLowerCase();
}

// Function to determine if query is likely an address (all digits)
function isAddress(query) {
  return /^\d+$/.test(query);
}

// Function to get the correct index file for a name
function getIndexFileForName(name) {
  const firstChar = name[0].toUpperCase();
  if (/\d/.test(firstChar)) {
    return 'index_0-9.txt';
  }
  return `index_${firstChar}.txt`;
}

// Function to get the correct batch file for an address
function getBatchFileForAddress(address) {
  const num = parseInt(address, 10);
  const start = Math.floor(num / 10000) * 10000;
  const end = start + 9999;
  return `${start}-${end}.txt`;
}

// Function to fetch and parse the index file for a name
async function fetchAddressForName(name) {
  const indexFile = getIndexFileForName(name);
  const url = `${REGISTRY_BASE_URL}${indexFile}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    // Entries are (name,address), separated by commas
    const entries = text.match(/\([^\)]+\)/g) || [];
    const sanitizedInput = sanitizeQuery(name);
    console.log('Sanitized input name:', sanitizedInput);
    for (const entry of entries) {
      const [entryName, entryAddress] = entry.slice(1, -1).split(',');
      const sanitizedEntryName = sanitizeQuery(entryName ? entryName.trim() : '');
      console.log('Comparing:', {
        entryName: entryName ? entryName.trim() : '',
        sanitizedEntryName,
        sanitizedInput
      });
      if (
        entryName &&
        entryAddress &&
        sanitizedEntryName === sanitizedInput
      ) {
        console.log('Match found:', entryName, '->', entryAddress);
        return entryAddress.trim();
      }
    }
    console.log('No match found for:', sanitizedInput);
    return null;
  } catch (e) {
    console.error('Error fetching address for name:', e);
    return null;
  }
}

// Function to fetch inscriptionId for an address
async function fetchInscriptionIdForAddress(address) {
  const batchFile = getBatchFileForAddress(address);
  const url = `${REGISTRY_BASE_URL}${batchFile}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    // Entries are (address,ID,T/F), separated by commas
    const entries = text.match(/\([^\)]+\)/g) || [];
    for (const entry of entries) {
      const [entryAddress, inscriptionId, isBitmapFlag] = entry.slice(1, -1).split(',');
      if (entryAddress && inscriptionId && entryAddress.trim() === address) {
        const isBitmap = (isBitmapFlag && isBitmapFlag.trim().toUpperCase() === 'T');
        return { inscriptionId: inscriptionId.trim(), isBitmap };
      }
    }
    return null;
  } catch {
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
    const match = url.match(/:\/\/([^\/]+)/);
    query = match ? match[1] : '';
  }

  if (query) {
    // Remove the first occurrence of .bitmap (case-insensitive) and everything after it
    query = query.replace(/\.bitmap.*$/i, '');
  }

  if (!query) {
    window.location.href = chrome.runtime.getURL(`error.html?query=unknown`);
    return;
  }

  const sanitizedQuery = sanitizeQuery(query);
  let address = null;
  let inscriptionId = null;

  if (isAddress(sanitizedQuery)) {
    address = sanitizedQuery;
  } else {
    // It's a name, look up address
    address = await fetchAddressForName(sanitizedQuery);
    if (!address) {
      window.location.href = chrome.runtime.getURL(`error.html?query=${encodeURIComponent(sanitizedQuery)}&type=name`);
      return;
    }
  }

  // Now look up inscriptionId for the address
  const result = await fetchInscriptionIdForAddress(address);
  if (result && result.inscriptionId) {
    if (result.isBitmap) {
      window.location.href = `https://ordinals.com/inscription/${result.inscriptionId}`;
    } else {
      window.location.href = `https://ordinals.com/content/${result.inscriptionId}`;
    }
  } else {
    window.location.href = chrome.runtime.getURL(`error.html?query=${encodeURIComponent(address)}&type=address`);
    return;
  }
})();
