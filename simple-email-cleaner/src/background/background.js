// Simple Email Cleaner - Background Script

class EmailCleanerBackground {
  constructor() {
    this.init();
  }

  init() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onInstall();
      } else if (details.reason === 'update') {
        this.onUpdate();
      }
    });

    // Listen for browser action click
    chrome.action.onClicked.addListener((tab) => {
      this.openPopup();
    });

    console.log('Email Cleaner background script loaded');
  }

  onInstall() {
    console.log('Email Cleaner installed');
    
    // Set default settings
    chrome.storage.local.set({
      emailStats: {
        totalEmails: 0,
        spamCount: 0,
        promotionalCount: 0,
        inboxScore: 100
      },
      settings: {
        autoScan: false,
        aggressiveMode: false,
        notifications: true
      }
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('docs/welcome.html')
    });
  }

  onUpdate() {
    console.log('Email Cleaner updated');
  }

  openPopup() {
    // This is handled by the manifest action.default_popup
    console.log('Popup requested');
  }

  // Handle long-running tasks
  async performBackgroundScan() {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://mail.google.com/*' });
      
      for (const tab of tabs) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'scanEmails' });
          if (response && response.success) {
            // Update badge with spam count
            const totalSpam = response.stats.spamCount + response.stats.promotionalCount;
            chrome.action.setBadgeText({
              text: totalSpam > 0 ? totalSpam.toString() : '',
              tabId: tab.id
            });
            chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
          }
        } catch (error) {
          console.error('Error scanning tab:', error);
        }
      }
    } catch (error) {
      console.error('Error in background scan:', error);
    }
  }
}

// Initialize background script
new EmailCleanerBackground();