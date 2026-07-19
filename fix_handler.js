const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');
let lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Fix line 375 - update comment
  if (lines[i].includes('Handle reward claim from notification click - trigger ad completion flow')) {
    lines[i] = '     } else if (ref === "reward-claim") {\\n' +
               '       // Handle reward claim from notification click - award coins immediately';
  }
  // Fix the console.log on line 377 (now shifted due to insert)
  if (lines[i].includes('Handling reward claim notification - triggering ad completion flow')) {
    lines[i] = '         console.log("Handling reward claim notification - awarding coins");';
  }
  // Remove outdated comments
  if (lines[i].includes('// Simulate ad completion by setting ad status to completed')) {
    lines[i] = '';
  }
  if (lines[i].includes("// This will show the success UI and handle the actual reward giving")) {
    lines[i] = '';
  }
  // Fix the fetch call - replace ad-complete with add-coins
  if (lines[i].includes('await fetch("/api/user/ad-complete", { method: "POST" })')) {
    lines[i] = '         // Actually award the coins (not just mark pending)\\n' +
               '         const response = await fetch("/api/user/add-coins", {\\n' +
               '           method: "POST",\\n' +
               '           headers: { "Content-Type": "application/json" },\\n' +
               '           body: JSON.stringify({ amount: 500, suppressNotification: true })\\n' +
               '         });\\n' +
               '\\n' +
               '         if (!response.ok) {\\n' +
               '           const errorData = await response.json();\\n' +
               '           throw new Error(errorData.error || "Failed to claim reward");\\n' +
               '         }';
  }
  // Fix console.log at end
  if (lines[i].includes('Reward processed via ad completion flow')) {
    lines[i] = '         console.log("Reward claimed successfully via notification click");';
  }
  // Fix setTimeout missing delay and error message
  if (lines[i].includes('setTimeout(() => {\\n           setAdStatus(\'idle\');\\n         });')) {
    // This is tricky - we need to find the specific setTimeout without delay
    if (lines[i-1].includes('setAdStatus(\'error\')')) {
      lines[i] = '        setTimeout(() => {\\n          setAdStatus(\'idle\');\\n        }, 3000);';
    }
  }
  if (lines[i].includes('Failed to process reward:')) {
    lines[i] = lines[i].replace('Failed to process reward:', 'Failed to claim reward:');
  }
}
c = lines.join('\n');
fs.writeFileSync('C:/PackSite/app/shop/page.tsx', c, 'utf8');
console.log('Fixed reward-claim handler');
