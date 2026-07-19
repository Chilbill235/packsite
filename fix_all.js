const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');

// Fix 1: handleTimerComplete - change ad-complete to add-coins with body (lines 267-271)
// Replace the exact text
c = c.replace(
  'const adCompleteResponse = await fetch("/api/user/ad-complete", {\\n          method: "POST",\\n          headers: { "Content-Type": "application/json" }\\n        });',
  'const addCoinsResponse = await fetch("/api/user/add-coins", {\\n          method: "POST",\\n          headers: { "Content-Type": "application/json" },\\n          body: JSON.stringify({ amount: 500, suppressNotification: true })\\n        });'
);
c = c.replace(/adCompleteResponse/g, 'addCoinsResponse');

// Fix 2: reward-claim handler - fix the fetch call (line 382)
c = c.replace(
  'await fetch("/api/user/ad-complete", { method: "POST" })',
  'const response = await fetch("/api/user/add-coins", {\\n          method: "POST",\\n          headers: { "Content-Type": "application/json" },\\n          body: JSON.stringify({ amount: 500, suppressNotification: true })\\n        });\\n\\n        if (!response.ok) {\\n          const errorData = await response.json();\\n          throw new Error(errorData.error || "Failed to claim reward");\\n        }'
);

// Fix 3: setTimeout missing delay in error handler (line 405)
c = c.replace(
  /setAdStatus\('error'\);\s+setTimeout\(\(\) => \{\s+setAdStatus\('idle'\);\s+\}\);/,
  "setAdStatus('error');\\n        setTimeout(() => {\\n          setAdStatus('idle');\\n        }, 3000);"
);

// Fix 4: Error message
c = c.replace('Failed to process reward:', 'Failed to claim reward:');

// Fix 5: Console log
c = c.replace('Reward processed via ad completion flow', 'Reward claimed successfully via notification click');

// Fix 6: Update comments
c = c.replace('Handle reward claim from notification click - trigger ad completion flow', 'Handle reward claim from notification click - award coins immediately');
c = c.replace('Handling reward claim notification - triggering ad completion flow', 'Handling reward claim notification - awarding coins');

// Fix 7: Remove outdated comments (lines 377-378)
c = c.replace(/\/\/ Simulate ad completion by setting ad status to completed\\n\s+\/\/ This will show the success UI and handle the actual reward giving/g, '');
c = c.replace('// Give the coins through the proper ad completion flow', '// Actually award the coins (not just mark pending)');

fs.writeFileSync('C:/PackSite/app/shop/page.tsx', c, 'utf8');
console.log('All fixes applied');
