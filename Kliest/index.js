
var process = require('process');
var cp = require('child_process');
var fs = require('fs');

var bot = cp.fork('bot.js');
console.log('Bot attempting to start...');

fs.watchFile('bot.js', function (event, filename) {
    bot.kill();
    console.log('Bot attempting to restart...');
    bot = cp.fork('bot.js');
});

process.on('SIGINT', function () {
    bot.kill();
    fs.unwatchFile('bot.js');
    process.exit();
});
