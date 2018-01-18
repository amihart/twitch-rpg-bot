const info_url = "https://raw.githubusercontent.com/amihart/twitch-rpg-bot/master/core/info.json";
const update_url = "https://raw.githubusercontent.com/amihart/twitch-rpg-bot/master/core/index.js";
var fs = require('fs');
var https = require('https');
main();

function main() {
	checkForUpdates();
}

function execute(file) {
	eval(fs.readFileSync(file)+"");
}

function checkForUpdates() {
	console.log("Checking for updates...");
	var info = JSON.parse(fs.readFileSync("info.json", "utf8"));
	var info_file = fs.createWriteStream("info.json");
	https.get(info_url, function(response) {
		var body = "";
		response.on("data", function(chunk) {
			body += chunk;
		});	
		response.on("end", function() {
			var new_info = JSON.parse(body);
			if (new_info['version'] == info['version']) {
				console.log("Software is up to date.");
				startBot();
			} else {
				console.log("New version detected."); 
				update();
			}
		});
		response.pipe(info_file);
	}).on("error", function(e) {
		console.log("Network error.");
	});

}

function update() {
	console.log("Updating...");
	var file = fs.createWriteStream("index.js");
	var request = https.get(update_url, function(response) {
		response.pipe(file);
		console.log("Update complete.");
		file.on("finish", function() {
			startBot();
		});
	});
}
function startBot() {
	console.log("Starting bot...");
	execute("index.js");
}
