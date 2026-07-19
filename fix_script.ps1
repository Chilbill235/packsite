{
    "editor": {
        "actions": [
            {
                "type": "replace",
                "old": "await fetch(\"/api/user/ad-complete\", { method: \"POST\" });\n        await fetchUserData(); // Refresh user data",
                "new": "const response = await fetch(\"/api/user/add-coins\", {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify({ amount: 500, suppressNotification: true })\n        });\n\n        if (!response.ok) {\n          const errorData = await response.json();\n          throw new Error(errorData.error || \"Failed to claim reward\");\n        }\n        await fetchUserData(); // Refresh user data to show updated balance"
            }
        ]
    }
}
