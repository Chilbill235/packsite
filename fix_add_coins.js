const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');
let lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const addCoinsResponse = await fetch("/api/user/add-coins"')) {
    // Check if the next few lines have the body
    if (!lines[i+1].includes('body:')) {
      // Replace the lines to add the body
      let newLines = [
        lines[i],
        '           method: "POST",',
        '           headers: { "Content-Type": "application/json" },',
        '           body: JSON.stringify({ amount: 500, suppressNotification: true })',
        '         });'
      ];
      // Remove the next 3 lines (method, headers, }), and insert our new lines
      lines.splice(i, 4, ...newLines);
      c = lines.join('\n');
      break;
    }
  }
}
fs.writeFileSync('C:/PackSite/app/shop/page.tsx', c, 'utf8');
console.log('Fixed');
