require('dotenv').config();
const fs = require('fs');
const Push = require('pushover-notifications');
const colors = require('colors');

//Supprime une chaine de TWITCH_CHANNEL_NAMES
function removeChannel(channelName) {
    const channelNames = process.env.TWITCH_CHANNEL_NAMES.split(',');
    if (!channelNames.includes(channelName)) {
        console.error(`${channelName} n'est pas dans TWITCH_CHANNEL_NAMES`);
        return;
    } // Verifie si la chaine est dans TWITCH_CHANNEL_NAMES
    channelNames.splice(channelNames.indexOf(channelName), 1);
    const newEnv = `TWITCH_CHANNEL_NAMES=${channelNames.join(',')}\n`;
    fs.writeFileSync('.env', fs.readFileSync('.env', 'utf8').replace(/^TWITCH_CHANNEL_NAMES=.*$/m, newEnv));
    console.log(`La chaine ${channelName} a bien été supprimée de TWITCH_CHANNEL_NAMES`);
} // Supprime la chaine de TWITCH_CHANNEL_NAMES

if (process.argv.length < 3) {
    console.error('Usage: node remove.js <channelName>');
    process.exit(1);
}

const channelName = process.argv[2];

const push = new Push({
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN
});

//Message pushover pour confirmer la suppression de la chaine
push.send({
    title: 'Suppression de chaine à Twitchnotifer',
    message: `La chaine ${channelName} a bien été supprimée de la liste des chaines à surveiller`,
    sound: 'magic',
    priority: 0
}, function (err, result) {
    if (err) {
        throw err;
    }
    console.log(`${colors.green(`Pushover: ${result}`)}`);
});

removeChannel(channelName);