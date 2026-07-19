const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');
// Add body parameter to the add-coins fetch call
let idx = c.indexOf('headers: {"Content-Type": "application/json"}');
if (idx > 0) {
  // Find the }); after this
  let endIdx = c.indexOf('});', idx);
  c = c.substring(0, idx + 'headers: { "Content-Type": "application/json" }'.length) + 
      ',\\n          body: JSON.stringify({ amount: 500, suppressNotification: true })' + 
      c.substring(endIdx);
  fs.writeFileSync('C:/PackSite/app/shop/page.tsx', c, 'utf8');
  console.log('Fixed body parameter');
} else {
  console.log('Pattern not found');
}
