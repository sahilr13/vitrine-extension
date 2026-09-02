// Markmez — background service worker
// Clicking the extension's toolbar icon quick-saves the current tab
// into the user's configured "quick save" board (handled by index.html
// when it's the active tab) — for any other tab we open a new tab
// pointed at the newtab page and pass the link along via storage.

async function quickSaveTab(tab) {
  if (!tab || !tab.url) return;
  const payload = { title: tab.title || tab.url, url: tab.url, ts: Date.now() };
  await chrome.storage.local.set({ markmez_pending_quicksave: payload });

  // If a Markmez new-tab page is already open, just focus it — its own
  // storage.onChanged listener will pick up the pending quick-save.
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((t) => t.url && t.url.startsWith("chrome://newtab"));
  if (existing) {
    chrome.tabs.update(existing.id, { active: true });
    chrome.windows.update(existing.windowId, { focused: true });
  } else {
    chrome.tabs.create({ url: "chrome://newtab/" });
  }
}

chrome.action.onClicked.addListener((tab) => quickSaveTab(tab));

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "quick-save") return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  quickSaveTab(tab);
});
