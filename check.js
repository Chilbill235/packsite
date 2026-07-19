const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');
// Add body parameter to the add-coins fetch call
let idx = c.indexOf('JSON');
console.log('Looking for pattern...');
console.log('Content around line 270:', c.substring(5000, 5500));
