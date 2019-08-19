//Get the current unix time in seconds.
function time() {
	return Math.floor(new Date().getTime()/1000);
}

//Chats the time the bot has been up.
function uptime() {
	var t = time() - start_time;
	var s = t % 60;
	t = (t - s) / 60;
	var m = t % 60;
	t = (t - m) / 60;
	var h = t;
	
	chat(h + "h " + m + "m " + s + "s");
}

//Convert the numeric weapon quality to its corresponding name. 
function qualityToName(q) {
	var name = "";
	const level_depth = 5;
	var sub_level = q % level_depth;
	var level = (q - sub_level) / level_depth;
	switch (sub_level) {
		case 0: name = "Broken"; break;
		case 1: name = "Old"; break;
		case 2: name = ""; break;
		case 3: name = "Reinforced"; break;
		case 4: name = "Mighty"; break;
	}
	name += " ";
	switch (level) {
		case 0: return name + "Wooden";
		case 1: return name + "Bronze";
		case 2: return name + "Iron";
		case 3: return name + "Steel";
		case 4: return name + "Silver";
		case 5: return name + "Dragonbone";
		case 6: return name + "Diamond";
		case 7: return name + "Ethereal";
		case 8: return name + "God";
		case 9: return name + "Waifu";
	}
	return name;
}

//Return a random number between 0 and top.
function rnd(top) {
	return (Math.floor(Math.random() * 100000) % (top + 1));
}

//Capitalize a word.
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function PlayerObject(username) {
	this.max_hp = 10;
	this.hp = 10;
	this.level = 1;
	this.next_level = 10;
	this.xp = 0;
	this.gold = 0;
	this.gold_time = time();
	var r = rnd(2);
	if (r == 0) this.weapon_class = "sword";
	else if (r == 1) this.weapon_class = "lance";
	else this.weapon_class = "axe";
	this.weapon_quality = 0;
}

//Updates the player's gold based on how much time has passed.
function updateGold(user) {
	var ud = user_data[user];
	var t = time();
	var gold_up = 0;
	const interval = 1;
	const limit = 1000 * ud.level;
	if (t >= ud.gold_time + interval) {
		gold_up = (t - ud.gold_time) / interval;
	}
	if (gold_up > limit) gold_up = limit;
	var level_gold = ud.level * Math.pow(0.9, ud.level);
	gold_up = Math.round(gold_up * level_gold);
	ud.gold += gold_up;
	ud.gold_time = time();
}

//Heal a user.
function heal(user) {
	var ud = user_data[user];
	if (ud.hp >= ud.max_hp) {
		chat(user + ", you are already at full health! RitzMitz");
	} else {
		const cost_per_hp = 10;			//10
		if (ud.gold < cost_per_hp) {
			chat(user + ", you don't have enough money for a health potion. FeelsBadMan");
		} else {
			var healing = ud.max_hp - ud.hp;	//5
			var cost = healing * cost_per_hp;	//50
			var expenditure = cost;			//50
			if (cost > ud.gold) {
				var over_expenditure = cost - ud.gold;
				healing -= Math.ceil(over_expenditure / cost_per_hp);
				cost = healing * cost_per_hp;	//asdf
				expenditure = cost;
			}
			ud.gold -= expenditure;
			ud.hp += healing;
			chat(user + " buys a health potion and recovers " + healing + " HP! CorgiDerp");
		}
	}
}

//Check if the user is dead.
function checkHP(user) {
	if (user_data[user].hp <= 0) {
		chat(user + " is dead! Jebaited");
		user_data[user].xp = 0;
		user_data[user].hp = user_data[user].max_hp;
		return -1;
	}
	return 1;
}

//Check if the user has gained a level. 
function checkXP(user) {
	var ud = user_data[user];
	if (ud.xp >= ud.next_level) {
		ud.level += 1;
		ud.next_level = Math.floor(ud.next_level * 2.5);
		ud.max_hp *= 2;
		ud.hp = ud.max_hp;
		chat(user + " has gained a level and is now level " + ud.level + "! PowerUpL TPcrunchyroll PowerUpR ");
	}
}

//Output the stats of the user.
function stats(user) {
	var ud = user_data[user];
	var weapon;	
	if (ud.weapon_class == "none") {
		weapon = "Unarmed";
	} else {
		weapon = qualityToName(ud.weapon_quality) + " " + capitalize(ud.weapon_class);
	}
	chat(user + ": Level: " + ud.level + ", HP: " + ud.hp + "/" + ud.max_hp + ", " +
		"EXP: " + ud.xp + "/" + ud.next_level + ", Weapon: " + weapon);
}

//Forge a new weapon for the user.
function forge(user) {
	var ud = user_data[user];
	if (ud.weapon_quality >= 49) {
		chat(user + ", you cannot forge your weapon any further. GivePLZ");
		return;
	}
	var cost = Math.floor(Math.pow(1.5, ud.weapon_quality + 1) * 100);
	if (cost <= ud.gold) {
		ud.weapon_quality += 1;
		ud.gold -= cost;
		chat(user + " has forged a " + qualityToName(ud.weapon_quality) + " " + ud.weapon_class + ". TPFufun"); 
	} else {
		chat(user + ", it requires " + cost + " gold to forge your weapon. BegWan");
	}
}

//See if the user1 has any bonuses against user2
function getBonus(user1, user2) {
	user1 = user_data[user1];
	user2 = user_data[user2];
	var bonus = 0;
	if (	user1.weapon_class != "none" && user2.weapon_class == "none" || 
		user1.weapon_class == "sword" && user2.weapon_class == "axe" || 
		user1.weapon_class == "axe" && user2.weapon_class == "lance" || 
		user1.weapon_class == "lance" && user2.weapon_class == "sword")  {
		bonus = 1.25;
	}
	if (bonus == 0) {
		bonus = user1.weapon_quality;
	} else {
		bonus *= user1.weapon_quality;
	}
	return Math.ceil(bonus);
}

//user1 attacks user2
function attack(user1, user2) {
	var hp_loss = rnd(10 + (user_data[user1].level - 1) * 3) + getBonus(user1, user2);
	if (hp_loss == 0) {
		chat(user2 + " is attacked but the attack misses! FailFish");
	} else if (hp_loss >= user1.level * 10) {
		chat(user2 + " is attacked and loses " + hp_loss + " HP! Critical hit! BlessRNG");
	} else {
		chat(user2 + " is attacked and loses " + hp_loss + " HP! Poooound KAPOW");
	}
	user_data[user2].hp -= hp_loss;

	if (user1 != user2) 
		user_data[user1].xp += user_data[user2].level * 2;
	else
		user_data[user1].xp += Math.ceil(user_data[user2].level / 2);

	var death_check = checkHP(user2);
	if (death_check == -1) {
		user_data[user1].xp += user_data[user2].level * 10;		
	}
	//if (user1 != user2) {
	checkXP(user1);
	//}
	return death_check;
}

//Output a message into the chat.
function chat(msg) {
	var channel = options.channels[0].replace("#", "");
	client.action(channel, msg);
}

//Play a sound.
function playSound(snd) {
	console.log("Playing sound `" + snd + "`...");
	if (!fs.existsSync("/Windows")) {
		console.log("...");
		var audio = player.play(snd, function(err) {});
		setTimeout(function() {
			audio.kill();
		}, 5000);
	} else {
		var cmd = "start wmplayer ";
		cmd += "\"%CD%\\" + snd + "\"";  
		exec(cmd, function(err, stdout, stderr) {
			if (err) {
				return;
			}
		});
	}
}

//Load the custom commands. 
function loadUserCommands() {
	var commands = fs.readFileSync("config/commands.txt", "utf8").split("\n");
	var ret = {};
	for (var i = 0; i < commands.length; i++) {
		var command = commands[i].split(":")[0];
		var output = "";
		for (var j = 1; j < commands[i].split(":").length; j++) {
			if (j != 1) output += ":";
			output += commands[i].split(":")[j];
		}
		if (command != undefined && output != undefined && command != "guide") {
			command = command.trim(); 
			output = output.trim();
			if (command.length > 0 && output.length > 0) {
				ret[command] = output;
			}
		}
	}
	return ret;
}

//Execute a command.
function doCommands(command, user, options) {
	for (var i = 0; i < options.length; i++) {
		options[i] = options[i].replace("@", "");
	}

	if (user_data[user] == undefined) {
		user_data[user] = new PlayerObject(user);
	}
	var ud = user_data[user];

	if (user_commands[command] != undefined) {
		var output = user_commands[command];
		var options_error = false;
		for (var i = 0; i < 9; i++) {
			if (output.replace("$" + i, "") != output && options[i] == undefined) {
				options_error = true;
				break;
			}
			output = output.replace("$" + i, options[i]);
		}
		if (!options_error) {
			if (user_commands[command].charAt(0) == "!") {
				playSound("sounds/" + output.split("!")[1]);
			} else {
				chat(output);
			}
		}
	}
	if (command == "uptime") {
		uptime();
	}
	if (command == "attack") {
		if (options[0] != undefined) {
			options[0] = options[0].toLowerCase();
			if (options.length == 0) {
				chat(user + ", you must specify a user to attack!");
			} else if (user_data[options[0]] == undefined) {
				chat(user + ", that user is not even here! FailFish"); 
			} else if (user == options[0]) {
				chat(user + " attacks themselves? SeriousSloth");
				attack(user, user);
			
			} else {
				battles[options[0]] = user;
				chat(user + " wants to battle " + options[0] + ". Type !accept to accept.");
			}
		}
	}
	if (command == "accept") {
		if (battles[user] == undefined) {
			chat(user + ", no one is trying to fight you. Pick"+
				" a fight with someone using !attack TehePelo");
		} else { 
			var user1 = battles[user];
			var user2 = user;
			chat(user1 + " has an epic anime battle with " + user2 + ". TehePelo");
			if (attack(user1, user2) != -1) {
				attack(user2, user1);
			}
			battles[user] = undefined;
		}
	}
	if (command == "stats") {
		if (options[0] != undefined) {
			var u = options[0].toLowerCase();
			if (user_data[u] == undefined) {
				chat(user + ", that user is not even here! FailFish"); 
			} else {
				stats(u);
			}
		} else {
			stats(user);
		}
	}
	if (command == "heal") {
		heal(user);
	}
	if (command == "gold") {
		chat(user + " has " + user_data[user].gold + " gold. BlessRNG TwitchRPG");
	}
	if (command == "forge") {
		forge(user);
	}
	if (command == "guide") {
		chat("Guide: goo.gl/sVXnPo");
	}
}

const tmi = require('tmi.js');
const fs = require('fs');
const { exec } = require('child_process');
const start_time = time();

var player = require('play-sound')(opts = {});
var battles = {};
var user_data = JSON.parse(fs.readFileSync("data.json", "utf8"));
var options = JSON.parse(fs.readFileSync("options.json", "utf8"));
var user_commands = loadUserCommands();
var client = new tmi.client(options);
client.connect();

client.on('chat', function(channel, user, message, self) {
	fs.writeFileSync("data.json", JSON.stringify(user_data), {"encoding":'utf8'});
	var username = user['display-name'].toString().toLowerCase();
	if (user_data[username] == undefined) {
		user_data[username] = new PlayerObject(username);
	}
	updateGold(username);
	if (message.charAt(0) == '!') {
		var input = message.substring(1, message.length).split(" ");
		var command = input[0];
		var options = new Array(0);
		for (var i = 1; i < input.length; i++) {
			options[options.length] = input[i];
		}
		doCommands(command, username, options);		
	}
});

client.on('connected', function(address, port) {
	console.log("Address: " + address + " Port: " + port);
});
