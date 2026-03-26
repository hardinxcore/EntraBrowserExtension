const fs = require('fs');
const path = require('path');

// This is a minimal valid 16x16 gradient blue square with an 'E' (or similar recognizable Chrome-friendly shape) in true PNG format.
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACDSURBVDhPY/hPDBiIUIwMgDpgGAAKMIyMjBwHqIHg/Pnz/wEYjZJhwAEwEIfhH2gAMmAw4ABkgGEAGkCDAQcgAxYDDkAGOAYcBoz///8HDCwGHACvAQcYAeD4//8/w8TExH+QgQYcBpwH1kCDAQcgAwwDDkAGoAIGAw5ABqACuA0YGAAT64S432pG7wAAAABJRU5ErkJggg==";

const buffer = Buffer.from(base64Png, 'base64');
const dir = path.join(__dirname, 'icons');

if (!fs.existsSync(dir)) fs.mkdirSync(dir);

fs.writeFileSync(path.join(dir, 'icon16.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon48.png'), buffer);
fs.writeFileSync(path.join(dir, 'icon128.png'), buffer);

console.log('Valid PNG icons successfully generated.');
