# Simple Email Cleaner

A browser extension that helps you clean up your Gmail inbox by automatically detecting and removing spam and promotional emails.

## Features

- 🔍 **Smart Email Detection**: Automatically identifies spam and promotional emails
- 🗑️ **One-Click Cleanup**: Remove unwanted emails with a single click
- 📊 **Inbox Health Score**: Track how clean your inbox is
- 🔒 **Privacy First**: All processing happens locally in your browser
- ⚡ **Fast & Lightweight**: Minimal impact on browser performance

## Installation

### From Source (Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your browser toolbar

### From Chrome Web Store
Coming soon!

## How to Use

1. **Open Gmail** in your browser
2. **Click the extension icon** in your toolbar
3. **Click "Scan Inbox"** to analyze your emails
4. **Review the results** and see detected spam/promotional emails
5. **Click "Clean Spam Emails"** or "Clean Promotional"** to remove them

## Privacy & Security

- All email analysis happens **locally in your browser**
- No email content is ever sent to external servers
- No personal data is collected or stored
- Open source code - you can verify everything yourself

## How It Works

The extension uses keyword analysis and sender pattern recognition to identify:
- **Spam emails**: Obvious spam with suspicious content
- **Promotional emails**: Marketing newsletters and offers
- **Sender patterns**: Common promotional email addresses

## Development
```bash
# Clone the repository
git clone https://github.com/yourusername/simple-email-cleaner.git
cd simple-email-cleaner

# The extension is ready to load - no build process needed!