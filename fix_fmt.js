const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');
c = c.split('headers: { "Content-Type": "application/json" }' + String.fromCharCode(13) + '           body:').join('headers: { "Content-Type": "application/json" },' + String.fromCharCode(13) + '           body:');
fs.writeFileSync('C:/PackSite/app/shop/page.tsx', c, 'utf8');
console.log('Fixed');
