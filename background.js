// background.js
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
  // Default settings
  chrome.storage.local.get(['geminiModel'], (result) => {
    if (!result.geminiModel) {
      chrome.storage.local.set({
        geminiModel: 'gemini-2.5-flash',
        summaryStyle: 'medium',
        summaryTone: 'easy',
        theme: 'dark'
      });
    }
  });

  // Context menu for text selection
  chrome.contextMenus.create({
    id: 'send_to_gemini_sidebar',
    title: 'Gửi vào Gemini Sidebar',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'send_to_gemini_sidebar' && info.selectionText) {
    chrome.sidePanel.open({ tabId: tab.id });
    // Delay to let the panel load
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'FILL_INPUT',
        text: info.selectionText
      });
    }, 1000);
  }
});
