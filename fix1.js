const fs = require("fs");
let c = fs.readFileSync("C:/PackSite/app/shop/page.tsx", "utf8");
c = c.replace("const adCompleteResponse = await fetch(""/api/user/ad-complete"", { method: ""POST"", headers: { ""Content-Type"": ""application/json"" } });", "const addCoinsResponse = await fetch(""/api/user/add-coins"", { method: ""POST"", headers: { ""Content-Type"": ""application/json"" }, body: JSON.stringify({ amount: 500, suppressNotification: true }) });");
c = c.replace(/adCompleteResponse/g, "addCoinsResponse");
fs.writeFileSync("C:/PackSite/app/shop/page.tsx", c, "utf8");
console.log("Done");
