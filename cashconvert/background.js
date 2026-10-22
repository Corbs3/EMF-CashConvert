// CashConvert background: side panel behaviour and right-click menu

const MENU_ID = 'cashconvert-convert';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Convert \u201c%s\u201d with Penny',
      contexts: ['selection']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const text = (info.selectionText || '').trim().slice(0, 100);
  // Open the panel first, inside the user gesture
  if (tab && tab.windowId !== undefined) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
  chrome.storage.session.set({ pending: { text, at: Date.now() } });
});
