require('dotenv').config();
const fs = require('fs');
const Push = require('pushover-notifications');
const colors = require('colors');

//Ajoute une chaine à TWITCH_CHANNEL_NAMES
function addChannel(channelName) {
    const channelNames = process.env.TWITCH_CHANNEL_NAMES.split(',');
    if (channelNames.includes(channelName)) {
        console.error(`${channelName} est déjà dans TWITCH_CHANNEL_NAMES`);
        return;
    } // Verifie si la chaine est déjà dans TWITCH_CHANNEL_NAMES
    channelNames.push(channelName);
    const newEnv = `TWITCH_CHANNEL_NAMES=${channelNames.join(',')}\n`;
    fs.writeFileSync('.env', fs.readFileSync('.env', 'utf8').replace(/^TWITCH_CHANNEL_NAMES=.*$/m, newEnv));
    console.log(`La chaine ${channelName} a bien été ajoutée a TWITCH_CHANNEL_NAMES`);
} // Ajoute la chaine à TWITCH_CHANNEL_NAMES

if (process.argv.length < 3) {
    console.error('Usage: node add.js <channelName>');
    process.exit(1);
}

const channelName = process.argv[2];

const push = new Push({
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN
});

//Message pushover pour confirmer l'ajout de la chaine
push.send({
    title: 'Ajout de chaine à Twitchnotifer',
    message: `La chaine ${channelName} a bien été ajoutée a la liste des chaines à surveiller`,
    sound: 'magic',
    priority: 0
}, function (err, result) {
    if (err) {
        throw err;
    }
    console.log(`${colors.green(`Pushover: ${result}`)}`);
});

addChannel(channelName);