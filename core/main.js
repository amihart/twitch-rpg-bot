const info_url = "https://raw.githubusercontent.com/amihart/twitch-rpg-bot/master/core/info.json";
const update_url = "https://raw.githubusercontent.com/amihart/twitch-rpg-bot/master/core/index.js";
const options_part1 = '{"options":{"debug":true},"connection":{"cluster":"aws","reconnect":true},"identity":{"username":"';
const options_part2 = '","password":"';
const options_part3 = '"},"channels": ["';
const options_part4 = '"]}';


var fs = require('fs');
var readline = require("readline");
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
var https = require('https');
main();

function main() {
	checkForInit();
}

//Execute a file.
function execute(file) {
	eval(fs.readFileSync(file)+"");
}

//Check if the bot has been initialized.
function checkForInit() {
	if (fs.existsSync("options.json")) {
		checkForUpdates();
	} else {
		console.log("Please initialize the bot.");
		var username = "";
		var oauth = "";
		var channel = "";
		rl.question("username: ", function(answer) {
			username = answer.trim();
			rl.question("oauth: ", function(answer) {
				oauth = "oauth:" + answer.replace("oauth:","").trim();
				rl.question("channel: ", function(answer) {
					channel = answer.trim();
					var output = 	options_part1 + username + 
							options_part2 + oauth + 
							options_part3 + channel + 
							options_part4;
					fs.writeFileSync("options.json", output, {"encoding":'utf8'});
					rl.close();
					checkForUpdates();
				});
			});
		}); 
		
	}
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
