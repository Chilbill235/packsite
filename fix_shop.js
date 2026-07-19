const fs = require('fs');

let content = fs.readFileSync('C:/PackSite/app/shop/page.tsx', 'utf8');

// Fix 1: Update comment
content = content.replace(
    'Handle reward claim from notification click - trigger ad completion flow',
    'Handle reward claim from notification click - award coins immediately'
);

// Fix 2: Update console.log
content = content.replace(
    'Handling reward claim notification - triggering ad completion flow',
    'Handling reward claim notification - awarding coins'
);

// Fix 3: Remove outdated comments
content = content.replace(
    '// Simulate ad completion by setting ad status to completed\\n        // This will show the success UI and handle the actual reward giving',
    ''
);

// Fix 4: Update console.log at end
content = content.replace(
    'Reward processed via ad completion flow',
    'Reward claimed successfully via notification click'
);

// Fix 5: Add missing delay to setTimeout (using regex)
content = content.replace(
    /setAdStatus\('error'\);\s+setTimeout\(\(\) => \{\s+setAdStatus\('idle'\);\s+\}\);\s+setErrorDialog\(\{ message: "Failed to process reward:/g,
    "setAdStatus('error');\n        setTimeout(() => {\n          setAdStatus('idle');\n        }, 3000);\n        setErrorDialog({ message: \"Failed to claim reward:"
);

fs.writeFileSync('C:/PackSite/app/shop/page.tsx', content, 'utf8');
console.log('All fixes applied');
