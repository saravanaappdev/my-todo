const fs = require('fs');
const path = require('path');

// Function to copy default assets
function copyDefaultAssets() {
  const defaultAssetsDir = path.join(__dirname, 'default-assets');
  const projectAssetsDir = path.join(__dirname, '..', 'assets');

  // Create assets directory if it doesn't exist
  if (!fs.existsSync(projectAssetsDir)) {
    fs.mkdirSync(projectAssetsDir);
  }

  // Copy default assets
  ['icon.png', 'adaptive-icon.png', 'splash.png'].forEach(file => {
    const defaultFile = path.join(__dirname, 'default-assets', file);
    const targetFile = path.join(projectAssetsDir, file);
    
    // Create a simple colored square if default asset doesn't exist
    if (!fs.existsSync(defaultFile)) {
      // Create a minimal 1x1 PNG for each required asset
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0D, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x64, 0x60, 0x60, 0x60,
        0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x5E, 0xF3, 0x2A, 0x3A, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(targetFile, minimalPNG);
    } else {
      fs.copyFileSync(defaultFile, targetFile);
    }
  });
}

copyDefaultAssets(); 