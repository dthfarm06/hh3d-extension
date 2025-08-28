# TẾ LỄ Chrome Extension

This project is a Chrome extension that provides a popup with a button labeled "TẾ LỄ". When clicked, it performs a series of actions on a specified webpage.

## Features

- Popup with a "TẾ LỄ" button.
- Opens the URL: [https://hoathinh3d.mx/danh-sach-thanh-vien-tong-mon?t=af075](https://hoathinh3d.mx/danh-sach-thanh-vien-tong-mon?t=af075).
- Searches for the "Tế Lễ" button on the loaded page and simulates a click.
- Displays the result or error in the popup.
- Saves the last clicked state to maintain the status across sessions.

## File Structure

```
te-le-extension
├── src
│   ├── popup.html        # HTML structure for the popup
│   ├── popup.js          # JavaScript for handling popup actions
│   ├── background.js      # Background script for managing state
│   ├── content.js        # Content script for interacting with the webpage
│   └── styles
│       └── popup.css     # CSS styles for the popup
├── manifest.json         # Extension configuration file
├── README.md             # Project documentation
└── assets
    └── icon.png         # Icon for the extension
```

## Installation

1. Download or clone the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click on "Load unpacked" and select the `te-le-extension` directory.
5. The extension should now appear in your toolbar.

## Usage

1. Click on the extension icon in the Chrome toolbar.
2. In the popup, click the "TẾ LỄ" button.
3. The extension will open the specified URL, find the "Tế Lễ" button, and simulate a click.
4. Any results or errors will be displayed in the popup.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.