const fs = require('fs');

let content = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');

// Remove outdated comments
content = content.replace(
    /\/\/ Simulate ad completion by setting ad status to completed\r?\n\s+\/\/ This will show the success UI and handle the actual reward giving/g,
    ''
);

fs.writeFileSync('C:/PackSite/app/shop/page.tsx', content, 'utf8');
console.log('Comments removed');
