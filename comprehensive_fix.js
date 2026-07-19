const fs = require('fs');
let c = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');

// Fix 1: handleTimerComplete - change ad-complete to add-coins with body
c = c.replace(
    'const adCompleteResponse = await fetch("/api/user/ad-complete", {\r?\n          method: "POST",\r?\n          headers: { "Content-Type": "application/json" }\r?\n        });',
    'const addCoinsResponse = await fetch("/api/user/add-coins", {\r\n          method: "POST",\r\n          headers: { "Content-Type": "application/json" },\r\n          body: JSON.stringify({ amount: 500, suppressNotification: true })\r\n        });'
);
c = c.replace(/adCompleteResponse/g, 'addCoinsResponse');

// Fix 2: reward-claim handler - update the whole block
c = c.replace(
    '} else if (ref === "reward-claim") {\r?\n      // Handle reward claim from notification click - trigger ad completion flow\r?\n      try {\r?\n        console.log("Handling reward claim notification - triggering ad completion flow");\r?\n        // Simulate ad completion by setting ad status to completed\r?\n        // This will show the success UI and handle the actual reward giving\r?\n        setAdStatus(\'completed\');\r?\n\r?\n        // Give the coins through the proper ad completion flow\r?\n        await fetch("/api/user/ad-complete", { method: "POST" });',
    '} else if (ref === "reward-claim") {\r\n      // Handle reward claim from notification click - award coins immediately\r\n      try {\r\n        console.log("Handling reward claim notification - awarding coins");\r\n        setAdStatus(\'completed\');\r\n\r\n        // Actually award the coins (not just mark pending)\r\n        const response = await fetch("/api/user/add-coins", {\r\n          method: "POST",\r\n          headers: { "Content-Type": "application/json" },\r\n          body: JSON.stringify({ amount: 500, suppressNotification: true })\r\n        });\r\n\r\n        if (!response.ok) {\r\n          const errorData = await response.json();\r\n          throw new Error(errorData.error || "Failed to claim reward");\r\n        }'
);

// Fix 3: setTimeout missing delay in error handler
c = c.replace(
    'setAdStatus(\'error\');\r?\n        setTimeout\(\(\) => \{\r?\n          setAdStatus(\'idle\');\r?\n        \}\);',
    'setAdStatus(\'error\');\r\n        setTimeout(() => {\r\n          setAdStatus(\'idle\');\r\n        }, 3000);'
);

// Fix 4: Error message
c = c.replace('Failed to process reward:', 'Failed to claim reward:');

// Fix 5: Console log
c = c.replace('Reward processed via ad completion flow', 'Reward claimed successfully via notification click');

fs.writeFileSync('C:/PackSite/app/shop/page.tsx', c, 'utf8');
console.log('All fixes applied to app/shop/page.tsx');
