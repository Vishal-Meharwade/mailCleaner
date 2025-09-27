// Simple Email Cleaner - Gmail Content Script

class GmailCleaner {
  constructor() {
    this.spamKeywords = [
      'unsubscribe', 'promotion', 'sale', 'deal', 'offer', 'discount',
      'limited time', 'act now', 'buy now', 'click here', 'free',
      'winner', 'congratulations', 'urgent', 'important notice',
      'verify account', 'suspended', 'expire', 'casino', 'loan',
      'credit', 'debt', 'investment', 'viagra', 'pharmacy'
    ];

    this.promotionalPatterns = [
      /no-reply@/i, /noreply@/i, /newsletter@/i, /marketing@/i,
      /promo@/i, /deals@/i, /offers@/i, /notifications@/i
    ];

    this.spamSenders = [
      'marketing@', 'noreply@', 'no-reply@', 'newsletter@',
      'promo@', 'deals@', 'offers@', 'notifications@'
    ];
  }

  // Main function to scan emails
  scanEmails() {
    console.log('Starting email scan...');
    
    try {
      const emails = this.getVisibleEmails();
      console.log(`Found ${emails.length} visible emails`);
      
      const analyzedEmails = [];
      let spamCount = 0;
      let promotionalCount = 0;

      emails.forEach((emailElement, index) => {
        const emailData = this.extractEmailData(emailElement);
        const analysis = this.analyzeEmail(emailData);
        
        if (analysis.type === 'spam' || analysis.type === 'promotional') {
          analyzedEmails.push({
            ...emailData,
            ...analysis,
            element: emailElement
          });
          
          if (analysis.type === 'spam') spamCount++;
          if (analysis.type === 'promotional') promotionalCount++;
        }
      });

      const stats = {
        totalEmails: emails.length,
        spamCount: spamCount,
        promotionalCount: promotionalCount,
        inboxScore: this.calculateInboxScore(emails.length, spamCount + promotionalCount)
      };

      console.log('Scan completed:', stats);

      return {
        success: true,
        emails: analyzedEmails,
        stats: stats
      };
      
    } catch (error) {
      console.error('Error scanning emails:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get visible emails from Gmail DOM
  getVisibleEmails() {
    // Gmail uses different selectors, try multiple approaches
    let emails = [];
    
    // Try different Gmail selectors
    const selectors = [
      'tr[data-legacy-thread-id]', // Classic Gmail
      '[data-thread-id]',          // New Gmail
      '.zA',                       // Gmail conversation
      '[role="main"] [data-thread-id]'
    ];

    for (const selector of selectors) {
      emails = Array.from(document.querySelectorAll(selector));
      if (emails.length > 0) {
        console.log(`Found emails using selector: ${selector}`);
        break;
      }
    }

    // Filter out emails that are not in inbox
    return emails.filter(email => {
      const style = window.getComputedStyle(email);
      return style.display !== 'none' && email.offsetHeight > 0;
    });
  }

  // Extract email data from Gmail DOM element
  extractEmailData(emailElement) {
    let sender = '';
    let subject = '';
    let snippet = '';

    try {
      // Try to find sender
      const senderSelectors = [
        '[data-hovercard-id]',
        '.yW span[email]',
        '.yW span[title]',
        '.yW span',
        '.go span'
      ];

      for (const selector of senderSelectors) {
        const senderElement = emailElement.querySelector(selector);
        if (senderElement) {
          sender = senderElement.getAttribute('email') || 
                  senderElement.getAttribute('title') || 
                  senderElement.textContent || '';
          if (sender.trim()) break;
        }
      }

      // Try to find subject
      const subjectSelectors = [
        '.bog',
        '.bqe',
        '[data-thread-id] .y6 span[id]',
        '.y6 span'
      ];

      for (const selector of subjectSelectors) {
        const subjectElement = emailElement.querySelector(selector);
        if (subjectElement) {
          subject = subjectElement.textContent || '';
          if (subject.trim()) break;
        }
      }

      // Try to find snippet/preview
      const snippetSelectors = [
        '.y2',
        '.bqf',
        '.y3'
      ];

      for (const selector of snippetSelectors) {
        const snippetElement = emailElement.querySelector(selector);
        if (snippetElement) {
          snippet = snippetElement.textContent || '';
          if (snippet.trim()) break;
        }
      }

    } catch (error) {
      console.error('Error extracting email data:', error);
    }

    return {
      sender: sender.trim() || 'Unknown Sender',
      subject: subject.trim() || 'No Subject',
      snippet: snippet.trim() || '',
      id: emailElement.getAttribute('data-thread-id') || emailElement.getAttribute('data-legacy-thread-id') || Math.random().toString(36)
    };
  }

  // Analyze email to determine if it's spam/promotional
  analyzeEmail(emailData) {
    const content = `${emailData.sender} ${emailData.subject} ${emailData.snippet}`.toLowerCase();
    let spamScore = 0;
    let reasons = [];

    // Check sender patterns
    if (this.promotionalPatterns.some(pattern => pattern.test(emailData.sender))) {
      spamScore += 30;
      reasons.push('Promotional sender pattern');
    }

    // Check for spam keywords in subject and content
    const keywordMatches = this.spamKeywords.filter(keyword => content.includes(keyword.toLowerCase()));
    spamScore += keywordMatches.length * 10;
    if (keywordMatches.length > 0) {
      reasons.push(`Spam keywords: ${keywordMatches.join(', ')}`);
    }

    // Check for promotional indicators
    if (content.includes('unsubscribe') || content.includes('click here') || content.includes('%')) {
      spamScore += 20;
      reasons.push('Contains promotional language');
    }

    // Determine type based on score
    let type = 'normal';
    if (spamScore >= 50) {
      type = 'spam';
    } else if (spamScore >= 20) {
      type = 'promotional';
    }

    return {
      type: type,
      score: spamScore,
      reasons: reasons,
      confidence: Math.min(spamScore / 50, 1)
    };
  }

  // Calculate inbox health score
  calculateInboxScore(totalEmails, unwantedEmails) {
    if (totalEmails === 0) return 100;
    const cleanEmails = totalEmails - unwantedEmails;
    return Math.round((cleanEmails / totalEmails) * 100);
  }

  // Clean emails by selecting and deleting them
  async cleanEmails(emailsToClean) {
    console.log(`Attempting to clean ${emailsToClean.length} emails`);
    
    try {
      let deletedCount = 0;

      for (const email of emailsToClean) {
        try {
          await this.selectAndDeleteEmail(email.element);
          deletedCount++;
          // Add delay to avoid overwhelming Gmail
          await this.delay(100);
        } catch (error) {
          console.error('Error deleting email:', error);
        }
      }

      return {
        success: true,
        deletedCount: deletedCount
      };

    } catch (error) {
      console.error('Error in clean emails:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Select and delete individual email
  async selectAndDeleteEmail(emailElement) {
    // Click on the email checkbox to select it
    const checkbox = emailElement.querySelector('[role="checkbox"]') || 
                    emailElement.querySelector('input[type="checkbox"]') ||
                    emailElement.querySelector('.oZ-x3 .T-Jo-auh');

    if (checkbox) {
      checkbox.click();
      await this.delay(50);

      // Try to find and click delete button
      const deleteButton = document.querySelector('[data-tooltip="Delete"]') ||
                          document.querySelector('[aria-label*="Delete"]') ||
                          document.querySelector('.ar9.T-I-J3.J-J5-Ji');

      if (deleteButton) {
        deleteButton.click();
        await this.delay(50);
      } else {
        // Try keyboard shortcut
        const event = new KeyboardEvent('keydown', {
          key: 'Delete',
          code: 'Delete',
          keyCode: 46
        });
        document.dispatchEvent(event);
      }
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize Gmail cleaner
const gmailCleaner = new GmailCleaner();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  if (request.action === 'scanEmails') {
    const result = gmailCleaner.scanEmails();
    sendResponse(result);
  } else if (request.action === 'cleanEmails') {
    gmailCleaner.cleanEmails(request.emails).then(result => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }
});

console.log('Gmail Email Cleaner content script loaded');