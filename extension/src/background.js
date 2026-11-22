chrome.action.setBadgeBackgroundColor({ color: '#ffd23f' });
chrome.action.setBadgeTextColor({ color: '#15171a' });

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'count' && sender.tab) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: msg.count ? String(msg.count) : '' });
  }
});
