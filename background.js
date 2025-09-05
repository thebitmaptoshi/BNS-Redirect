// Update declarativeNetRequest rules
async function updateRules() {
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
