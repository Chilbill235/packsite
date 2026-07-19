const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');

// Fix 1: handleTimerComplete - replace the entire fetch block
c = c.replace(
  /const adCompleteResponse = await fetch("\/api\/user\/ad-complete", \{\s+method: "POST",\\s+headers: \{ "Content-Type": "application\/json" \}\s+\}\);/g,
  'const addCoinsResponse = await fetch("/api/user/add-coins", {\n          method: "POST",\n          headers: { "Content-Type": "application/json" },\n          body: JSON.stringify({ amount: 500, suppressNotification: true })\n        });'
);

// Replace variable names
c = c.replace(/adCompleteResponse/g, 'addCoinsResponse');

fs.writeFileSync('C:/PackSite/app/shop/page.tsx', c, 'utf8');
console.log('Fixed handleTimerComplete');
