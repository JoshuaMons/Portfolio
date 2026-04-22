const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
const destDir = path.resolve(__dirname, '../public');
const dest = path.join(destDir, 'sql-wasm.wasm');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('sql-wasm.wasm copied to public/');
  }
} catch (e) {
  console.warn('Could not copy sql-wasm.wasm:', e.message);
}
