chrome.action.setBadgeBackgroundColor({ color: '#ff4fa8' });
chrome.action.setBadgeTextColor({ color: '#1c0733' });

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'count' && sender.tab) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: msg.count ? String(msg.count) : '' });
  }
});
