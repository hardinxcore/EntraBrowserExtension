const fs = require('fs');
const path = require('path');

// Base64 for a simple 16x16 transparent/blue PNG icon
// This way Chrome doesn't crash on invalid WebP images
const base64Icon = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgG8t4qKxgAAAABJRU5ErkJggg==';

const buffer = Buffer.from(base64Icon, 'base64');
const dir = path.join(__dirname, 'icons');

if (!fs.existsSync(dir)) fs.mkdirSync(dir);

fs.writeFileSync(path.join(dir, 'icon16.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon48.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon128.png'), buffer);

console.log('Icons written successfully to png format.');
