const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');
// Find the add-coins fetch in handleTimerComplete
let lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/api/user/add-coins') && !lines[i].includes('suppressNotification')) {
    console.log('Found add-coins at line', i+1, ':', lines[i]);
    console.log('Line', i+1, ':', lines[i+1]);
  }
}
