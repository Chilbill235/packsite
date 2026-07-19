const fs = require('fs');  
let c=fs.readFileSync('C:/PackSite/app/shop/page.tsx','utf8');  
c=c.replace(/adCompleteResponse\.status/g,'addCoinsResponse.status');  
c=c.replace('headers: { \" "Content-Type\: \application/json\ }\\n        });','headers: { \Content-Type\: \application/json\ },\\n          body: JSON.stringify({ amount: 500, suppressNotification: true })\\n        });');  
fs.writeFileSync('C:/PackSite/app/shop/page.tsx',c,'utf8');  
console.log('done');  
