'use strict';

const CONFIG_KEY = 'ainsStudioConfigV1';
const AINS_MATCH = 'https://ains.moe.gov.my/web/';

async function getConfig() {
  const stored = await chrome.storage.local.get(CONFIG_KEY);
  return stored[CONFIG_KEY] || { enabled: true, features: { appearance: true } };
}

function isStudioRoute(url) {
  try {
    const parsed = new URL(url);
    return ['1', 'extensions', 'settings', '404'].includes(parsed.searchParams.get('ains-studio')) || parsed.pathname.startsWith('/web/ains-studio');
  } catch (_) { return false; }
}

async function applyStyles(tabId, url) {
  if (!url?.startsWith(AINS_MATCH)) return;
  const config = await getConfig();
  const studioRoute = isStudioRoute(url);
  try { await chrome.scripting.removeCSS({ target: { tabId }, files: ['styles.css'] }); } catch (_) {}
  try { await chrome.scripting.removeCSS({ target: { tabId }, files: ['studio-nav.css'] }); } catch (_) {}
  try { await chrome.scripting.insertCSS({ target: { tabId }, files: ['studio-nav.css'] }); } catch (_) {}
  if (config.enabled !== false && (config.features?.appearance !== false || studioRoute)) {
    try { await chrome.scripting.insertCSS({ target: { tabId }, files: ['styles.css'] }); } catch (_) {}
  }
}

async function applyAllTabs() {
  const tabs = await chrome.tabs.query({ url: `${AINS_MATCH}*` });
  await Promise.all(tabs.map(tab => applyStyles(tab.id, tab.url)));
}

chrome.action.onClicked.addListener(async tab => {
  const url = 'https://ains.moe.gov.my/web/dashboard?ains-studio=settings';
  if (tab.id && tab.url?.startsWith(AINS_MATCH) && isStudioRoute(tab.url) && new URL(tab.url).searchParams.get('ains-studio') === 'settings') await chrome.tabs.update(tab.id, { url, active: true });
  else await chrome.tabs.create({ url });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'ains-studio-open-settings') return;
  const url = 'https://ains.moe.gov.my/web/dashboard?ains-studio=settings';
  if (sender.tab?.id && isStudioRoute(sender.tab.url || '') && new URL(sender.tab.url).searchParams.get('ains-studio') === 'settings') chrome.tabs.update(sender.tab.id, { active: true });
  else chrome.tabs.create({ url });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') applyStyles(tabId, tab.url);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[CONFIG_KEY]) applyAllTabs();
});

chrome.runtime.onInstalled.addListener(applyAllTabs);
chrome.runtime.onStartup.addListener(applyAllTabs);
