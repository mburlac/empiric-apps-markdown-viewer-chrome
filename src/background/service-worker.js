chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === 'FETCH_TEXT' && typeof msg.url === 'string') {
    fetch(msg.url)
      .then(r => r.ok ? r.text().then(text => ({ ok: true, text })) : { ok: false, error: 'HTTP ' + r.status })
      .catch(e => ({ ok: false, error: String(e) }))
      .then(sendResponse);
    return true;
  }

  if (msg.type === 'DETECTED' && sender.tab && sender.tab.id != null) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: 'MD' });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#0969da' });
    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({ tabId: sender.tab.id, color: '#ffffff' });
    }
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_VIEW' }).catch(() => {});
  }
});

chrome.commands.onCommand.addListener((cmd, tab) => {
  if (cmd === 'toggle-view' && tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_VIEW' }).catch(() => {});
  }
});
