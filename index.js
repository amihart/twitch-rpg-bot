var fs = require('fs');

console.log("Checking for updates...");
var info = JSON.parse(fs.readFileSync("core/info.json", "utf8"));

console.log(info['version']);

