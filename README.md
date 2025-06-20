# LinkedIn Message Templates Chrome Extension

A Chrome extension that helps you send personalized LinkedIn messages using customizable templates with automatic name and company detection.

## ✨ Features

- 📝 **Template Management**: Create, save, and manage multiple message templates
- 🎯 **Smart Placeholders**: Use `{{name}}` and `{{company}}` placeholders that auto-populate
- 🤖 **Automatic Detection**: Intelligently extracts recipient's name and company from LinkedIn profiles
- 🚀 **Quick Insertion**: Convenient dropdown appears when composing messages on LinkedIn
- 💾 **Cloud Sync**: Templates sync across all your Chrome instances
- 🎨 **Clean Interface**: Modern, LinkedIn-styled design that integrates seamlessly

## 🚀 Installation

### Option 1: Load as Unpacked Extension (Development)

1. **Download or Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the folder containing the extension files
5. **Verify Installation** - you should see the extension in your extensions list

### Option 2: Chrome Web Store (Coming Soon)
*This extension will be published to the Chrome Web Store soon.*

## 📋 How to Use

### 1. Creating Templates

1. **Click the extension icon** in your Chrome toolbar
2. **Type your message template** in the text area
   - Use `{{name}}` where you want the recipient's first name
   - Use `{{company}}` where you want their company name
3. **Click "Save Template"** to store it

#### Example Templates:

```
Hi {{name}}, I noticed you work at {{company}} and would love to connect!
```

```
Hello {{name}}, I'm reaching out because I'm interested in opportunities at {{company}}. Would you be open to a brief chat?
```

```
Hi {{name}}, I saw your background at {{company}} and think we might have some mutual interests to discuss.
```

### 2. Using Templates on LinkedIn

1. **Navigate to LinkedIn** messaging (any conversation or new message)
2. **Look for the blue dropdown** that appears above the message input field
3. **Select a template** from the dropdown menu
4. **Watch the magic** - the template will be inserted with the person's name and company automatically filled in
5. **Edit if needed** and send your personalized message!

### 3. Managing Templates

- **View Templates**: All saved templates appear in the extension popup
- **Delete Templates**: Click the "×" button next to any template to remove it
- **Edit Templates**: Delete and recreate templates to modify them

## 🎯 Smart Detection Features

### Name Detection
The extension automatically detects the recipient's first name from:
- Profile headers
- Message thread participants
- Contact cards
- Various LinkedIn interface layouts

### Company Detection
The extension extracts company information from:
- Job titles (e.g., "Software Engineer at Google")
- Profile subtitles
- Education info (e.g., "MBA Candidate at Harvard Business School")
- Experience sections

### Fallback Behavior
- If a name can't be detected, it uses "there" as a friendly fallback
- If a company can't be detected, it uses "your company" as a neutral placeholder

## 🔧 Technical Details

### Permissions Required
- **Storage**: To save your templates across browser sessions
- **Active Tab**: To interact with LinkedIn pages
- **LinkedIn Access**: To read profile information and inject templates

### Compatibility
- **LinkedIn Domains**: Works on both `linkedin.com` and `www.linkedin.com`
- **Chrome Version**: Requires Chrome with Manifest V3 support
- **LinkedIn Layouts**: Compatible with both old and new LinkedIn messaging interfaces

### File Structure
```
linkedin-message-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Template management logic
├── content.js            # LinkedIn page integration
├── icon.png              # Extension icon
└── README.md             # This file
```

## 🔍 Troubleshooting

### Templates Not Appearing
- **Refresh LinkedIn**: Try refreshing the LinkedIn page
- **Check URL**: Ensure you're on `linkedin.com` or `www.linkedin.com`
- **Extension Enabled**: Verify the extension is enabled in `chrome://extensions/`

### Name/Company Not Detected
- **Profile Visibility**: Some profiles may have limited public information
- **New LinkedIn Layouts**: LinkedIn frequently updates their interface; detection may need time to adapt
- **Manual Edit**: You can always edit the inserted text manually

### Dropdown Not Showing
- **Create Templates**: The dropdown only appears when you have saved templates
- **Message Interface**: Ensure you're in a LinkedIn messaging interface
- **Browser Cache**: Try clearing your browser cache and reloading

### Templates Not Saving
- **Storage Permissions**: Check that the extension has proper permissions
- **Chrome Sync**: Ensure Chrome sync is enabled for extensions
- **Storage Quota**: Chrome extensions have storage limits; delete unused templates if needed

## 🛠️ Development

### Running in Development Mode

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd linkedin-message-extension
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

3. **Make changes** and reload the extension to test

### Key Files to Modify

- **`popup.html/popup.js`**: Template management interface
- **`content.js`**: LinkedIn integration and detection logic
- **`manifest.json`**: Extension permissions and configuration

## 📄 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Areas for Improvement
- Enhanced company detection algorithms
- Support for more social networks
- Template categories and organization
- Import/export functionality

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Create an issue in the GitHub repository
3. Ensure you're using a supported Chrome version

---

**Happy networking on LinkedIn!** 🚀 