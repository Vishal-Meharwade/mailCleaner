// Simple Email Cleaner - Popup Script

class EmailCleanerPopup {
  constructor() {
    this.stats = {
      totalEmails: 0,
      spamCount: 0,
      promotionalCount: 0,
      inboxScore: 0
    };
    
    this.scannedEmails = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadStoredStats();
  }

  setupEventListeners() {
    document.getElementById('scan-emails').addEventListener('click', () => {
      this.scanEmails();
    });

    document.getElementById('clean-emails').addEventListener('click', () => {
      this.cleanSpamEmails();
    });

    document.getElementById('clean-promotional').addEventListener('click', () => {
      this.cleanPromotionalEmails();
    });
  }

  async loadStoredStats() {
    try {
      const result = await chrome.storage.local.get(['emailStats']);
      if (result.emailStats) {
        this.stats = result.emailStats;
        this.updateStatsDisplay();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async scanEmails() {
    this.setStatus('🔍 Scanning emails...', true);
    this.disableButtons(true);

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('mail.google.com')) {
        this.setStatus('❌ Please open Gmail first!');
        this.disableButtons(false);
        return;
      }

      // Send message to content script to scan emails
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'scanEmails' 
      });

      if (response && response.success) {
        this.scannedEmails = response.emails;
        this.stats = response.stats;
        this.updateStatsDisplay();
        this.displayResults();
        this.saveStats();
        this.setStatus(`✅ Found ${response.stats.spamCount + response.stats.promotionalCount} emails to clean`);
        
        // Enable clean buttons if there are emails to clean
        document.getElementById('clean-emails').disabled = response.stats.spamCount === 0;
        document.getElementById('clean-promotional').disabled = response.stats.promotionalCount === 0;
      } else {
        throw new Error(response?.error || 'Failed to scan emails');
      }
    } catch (error) {
      console.error('Scan error:', error);
      this.setStatus('❌ Error scanning emails. Make sure you\'re on Gmail.');
    }
    
    this.disableButtons(false);
  }

  async cleanSpamEmails() {
    await this.cleanEmailsByType('spam');
  }

  async cleanPromotionalEmails() {
    await this.cleanEmailsByType('promotional');
  }

  async cleanEmailsByType(type) {
    const emailsToClean = this.scannedEmails.filter(email => email.type === type);
    
    if (emailsToClean.length === 0) {
      this.setStatus(`❌ No ${type} emails found to clean`);
      return;
    }

    const confirmed = confirm(`Delete ${emailsToClean.length} ${type} emails? This cannot be undone.`);
    if (!confirmed) return;

    this.setStatus(`🗑️ Cleaning ${emailsToClean.length} ${type} emails...`, true);
    this.disableButtons(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'cleanEmails',
        emails: emailsToClean
      });

      if (response && response.success) {
        this.setStatus(`✅ Successfully cleaned ${response.deletedCount} emails!`);
        // Refresh the scan
        setTimeout(() => this.scanEmails(), 1000);
      } else {
        throw new Error(response?.error || 'Failed to clean emails');
      }
    } catch (error) {
      console.error('Clean error:', error);
      this.setStatus('❌ Error cleaning emails. Please try again.');
    }

    this.disableButtons(false);
  }

  updateStatsDisplay() {
    document.getElementById('total-emails').textContent = this.stats.totalEmails;
    document.getElementById('spam-count').textContent = this.stats.spamCount + this.stats.promotionalCount;
    document.getElementById('inbox-score').textContent = this.stats.inboxScore + '%';
  }

  displayResults() {
    const resultsSection = document.getElementById('results');
    const resultsList = document.getElementById('results-list');
    
    if (this.scannedEmails.length === 0) {
      resultsSection.style.display = 'none';
      return;
    }

    resultsSection.style.display = 'block';
    resultsList.innerHTML = '';

    // Show first 10 emails
    const emailsToShow = this.scannedEmails.slice(0, 10);
    
    emailsToShow.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.className = 'email-item';
      
      const labelClass = email.type === 'spam' ? 'spam-label' : 'promotional-label';
      const labelText = email.type === 'spam' ? 'SPAM' : 'PROMO';
      
      emailDiv.innerHTML = `
        <div class="email-sender">${this.truncate(email.sender, 30)}
          <span class="${labelClass}">${labelText}</span>
        </div>
        <div class="email-subject">${this.truncate(email.subject, 40)}</div>
      `;
      
      resultsList.appendChild(emailDiv);
    });

    if (this.scannedEmails.length > 10) {
      const moreDiv = document.createElement('div');
      moreDiv.className = 'email-item';
      moreDiv.innerHTML = `<div style="text-align: center; color: #666;">... and ${this.scannedEmails.length - 10} more emails</div>`;
      resultsList.appendChild(moreDiv);
    }
  }

  truncate(str, length) {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }

  async saveStats() {
    try {
      await chrome.storage.local.set({ emailStats: this.stats });
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  setStatus(message, loading = false) {
    const statusElement = document.getElementById('status');
    statusElement.innerHTML = loading ? `<div class="loading"></div>${message}` : message;
  }

  disableButtons(disabled) {
    document.getElementById('scan-emails').disabled = disabled;
    if (!disabled) {
      // Only re-enable clean buttons if there are emails to clean
      document.getElementById('clean-emails').disabled = this.stats.spamCount === 0;
      document.getElementById('clean-promotional').disabled = this.stats.promotionalCount === 0;
    } else {
      document.getElementById('clean-emails').disabled = true;
      document.getElementById('clean-promotional').disabled = true;
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EmailCleanerPopup();
});