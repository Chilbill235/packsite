import re

with open('C:/PackSite/app/shop/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Update the reward-claim handler comment
content = content.replace(
    '// Handle reward claim from notification click - trigger ad completion flow',
    '// Handle reward claim from notification click - award coins immediately'
)

# Fix 2: Update the console.log message
content = content.replace(
    'console.log("Handling reward claim notification - triggering ad completion flow")',
    'console.log("Handling reward claim notification - awarding coins")'
)

# Fix 3: Remove outdated comments
content = content.replace(
    '// Simulate ad completion by setting ad status to completed\n        // This will show the success UI and handle the actual reward giving',
    ''
)

# Fix 4: Update the console.log at the end
content = content.replace(
    'console.log("Reward processed via ad completion flow")',
    'console.log("Reward claimed successfully via notification click")'
)

# Fix 5: Add missing delay to setTimeout in error handler
content = content.replace(
    "setAdStatus('error');\n        setTimeout(() => {\n          setAdStatus('idle');\n        });\n        setErrorDialog({ message: \"Failed to process reward:",
    "setAdStatus('error');\n        setTimeout(() => {\n          setAdStatus('idle');\n        }, 3000);\n        setErrorDialog({ message: \"Failed to claim reward:"
)

with open('C:/PackSite/app/shop/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('All text fixes applied')
