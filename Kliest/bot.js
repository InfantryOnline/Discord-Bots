const config = require('./config.json');
const Discord = require('discord.js');
const request = require("request")
	const fs = require("fs");

const util = require('util');
const bot = new Discord.Client({
		disableEveryone: true,
		disabledEvents: ['TYPING_START']
	});

var troopers = null;
var last10Alert = null;
var last20Alert = null;
var last40Alert = null;
var last60Alert = null;
var last100Alert = null;
var NotifyChannel;

var peakPlayers = 0;

bot.on("ready", () => {

	try {
		if (fs.existsSync('data.json')) {
			let rawdata = fs.readFileSync('data.json');
			let data = JSON.parse(rawdata);

			last10Alert = data.last10Alert;
			last20Alert = data.last20Alert;
			last40Alert = data.last40Alert;
			last60Alert = data.last60Alert;
			last100Alert = data.last200Alert;
			peakPlayers = data.peakPlayers;
		}
	} catch (err) {
		console.error(err)
	}

	bot.user.setGame('Infantry');
	NotifyChannel = bot.channels.find("id", config.channelID);
	const guild = bot.guilds.get(config.serverID);
	troopers = guild.roles.find("name", config.alertRole);
	console.log(`Bot is online!\n${bot.users.size} users, in ${bot.guilds.size} servers connected.`);
});

bot.on("message", async message => {

	if (message.author.bot || message.system)
		return; // Ignore bots

	let member = message.member;

	console.log(message.content);

	if (message.content.indexOf(config.prefix) === 0) {
		let msg = message.content.slice(config.prefix.length);

		let args = msg.split(" ");

		let cmd = args[0].toLowerCase();

		args.shift();

		if (cmd === 'noalerts' && message.channel.type === 'dm') {
			bot.guilds.get(config.serverID).members.get(message.author.id).removeRole(troopers);
			message.author.send(`${message.author.toString()}, You will no longer receive alerts`);
			return;
		} else if (cmd === 'alerts' && message.channel.type === 'dm') {
			bot.guilds.get(config.serverID).members.get(message.author.id).addRole(troopers);
			message.author.send(`${message.author.toString()}, You will now receive alerts`);
			return;
		} else if (cmd === 'ping' && message.author.id === config.owner) {
			message.channel.send("pong");
			return;
		} else if (cmd === 'online') {
			
			var zoneCount = 0;
			

		request({
			url: config.directory,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				var popMsg = "```\n";
				body.forEach(function (zone) {

					zoneCount = zoneCount + zone.PlayerCount;
					if (zone.PlayerCount > 0) {
						popMsg = popMsg + zone.Title + ": " + zone.PlayerCount + "\n";
					}

				});

				popMsg = popMsg + "Current Population: " + zoneCount + " | Peak Population: " + peakPlayers + "\n```";
				message.channel.send(popMsg);
			}
		});
		
			return;
		}

		return;
	}
});

//Polls the directory for a playercount & checks if an alert should be sent
(function pollForAlerts() {

	//Are we even connected?
	if (typeof NotifyChannel !== 'defined' && NotifyChannel == null) {
		setTimeout(pollForAlerts, 5000);
		return;
	}

	var totalPlayers = 0;
	request({
		url: config.directory,
		json: true
	}, function (error, response, body) {

		if (!error && response.statusCode === 200) {
			body.forEach(function (zone) {
				var zoneCount = zone.PlayerCount;
				totalPlayers = totalPlayers + zoneCount;

			});

		}

		if (totalPlayers > peakPlayers) {
			peakPlayers = totalPlayers;
		}

		var currentDate = new Date().getTime();

		if (totalPlayers > 10 && totalPlayers < 20) {

			if (typeof last10Alert !== 'undefined' && last10Alert !== null) {

				if (currentDate > last10Alert) {
					last10Alert = new Date().getTime() + (24 * 60 * 60 * 1000) //Only show this alert every 24 hours
						sendAlert(totalPlayers);
				}

			} else {
				last10Alert = new Date().getTime() + (24 * 60 * 60 * 1000)
					sendAlert(totalPlayers);
			}
		}
		if (totalPlayers > 20 && totalPlayers < 40) {

			if (typeof last20Alert !== 'undefined' && last20Alert !== null) {

				if (currentDate > last20Alert) {
					last20Alert = new Date().getTime() + (24 * 60 * 60 * 1000)
						sendAlert(totalPlayers);
				}

			} else {
				last20Alert = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
					sendAlert(totalPlayers);
			}
		}
		if (totalPlayers > 40 && totalPlayers < 60) {

			if (typeof last40Alert !== 'undefined' && last40Alert !== null) {

				if (currentDate > last40Alert) {
					last40Alert = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
						sendAlert(totalPlayers);
				}

			} else {
				last40Alert = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
					sendAlert(totalPlayers);
			}
		}
		if (totalPlayers > 60 && totalPlayers < 100) {

			if (typeof last60Alert !== 'undefined' && last60Alert !== null) {

				if (currentDate > last60Alert) {
					last60Alert = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
						sendAlert(totalPlayers);
				}

			} else {
				last60Alert = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
					sendAlert(totalPlayers);
			}
		}
		if (totalPlayers > 100) {

			if (typeof last100Alert !== 'undefined' && last100Alert !== null) {

				if (currentDate > last100Alert) {
					last100Alert = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
						sendAlert(totalPlayers);
				}

			} else {
				last100Alert = new Date().getTime() + (1 * 24 * 60 * 60 * 1000)
					sendAlert(totalPlayers);
			}
		}
	})

	setTimeout(pollForAlerts, 5000);
}
	());

//Sends an alert for the current amount of players
function sendAlert(totalPlayers) {
	if (typeof NotifyChannel !== 'undefined' && NotifyChannel !== null) {

		var msg = `Attention ${troopers}! There are currently ${totalPlayers} users playing Infantry Online. Report for duty Soldier! If you would like to opt out of alerts please PM me !noalerts. Alternatively, if you would like to reenable alerts, please PM me !alerts`;

		request({
			url: config.directory,
			json: true
		}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				msg = msg + "\n```\n";
				body.forEach(function (zone) {
					var zoneCount = zone.PlayerCount;
					if (zoneCount > 0) {
						msg = msg + zone.Title + ": " + zoneCount + "\n";
					}

				});

				msg = msg + "Current Population: " + totalPlayers + " | Peak Population: " + peakPlayers + "\n```";
				NotifyChannel.send(msg);
			}
		})

		var data = {
			last10Alert: last10Alert,
			last20Alert: last20Alert,
			last40Alert: last40Alert,
			last60Alert: last60Alert,
			last100Alert: last100Alert,
			peakPlayers: peakPlayers
		};
		saveData(data);
	}
}

function saveData(data) {
	fs.writeFile("./data.json", JSON.stringify(data, null, 4), (err) => {
		if (err) {
			console.error(err);
			return;
		};
	});
}

// Catch Errors before they crash the bot
process.on('uncaughtException', (err) => {
	const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
	console.error('Uncaught Exception: ', errorMsg);
});

process.on('unhandledRejection', err => {
	console.error('Uncaught Promise Error: ', err);
});

bot.login(config.token);