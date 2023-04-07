const axios = require('axios');
const Push = require('pushover-notifications');
const colors = require('colors');
require('dotenv').config();
const TWITCH_CHANNEL_NAMES = process.env.TWITCH_CHANNEL_NAMES.split(',').filter(Boolean);
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_REFRESH_TOKEN = process.env.TWITCH_REFRESH_TOKEN;

//Indentifiant pour pushover
const push = new Push({
    user: process.env.PUSHOVER_USER,
    token: process.env.PUSHOVER_TOKEN
});

let accessToken = null;
let accessTokenExpiration = null;
let isErrorSent = false;
let streamStatuses = {}; // Status initial des chaines (online/offline)

// Connexion à Twitch
async function getAccessToken() {
    if (!accessToken || Date.now() >= accessTokenExpiration) {
        const url = 'https://id.twitch.tv/oauth2/token';
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', TWITCH_REFRESH_TOKEN);
        params.append('client_id', TWITCH_CLIENT_ID);
        params.append('client_secret', TWITCH_CLIENT_SECRET);
        const response = await axios.post(url, params);
        accessToken = response.data.access_token;
        accessTokenExpiration = Date.now() + (response.data.expires_in * 1000);
    } // Renouvellement du token d'access si celui-ci est expiré
    return accessToken;
} console.log(`${colors.green(`Connexion à Twitch: OK\n${TWITCH_CHANNEL_NAMES.length} chaines à surveiller`)}`);

// Verification de la connexion a Pushover
push.send({
    title: 'Twitchnotifer Pushover: OK',
    message: `Le script est en cours de fonctionnement et surveille ${TWITCH_CHANNEL_NAMES.length} chaines twitch`,
    sound: 'magic',
    priority: 0
}, function (err, result) {
    if (err) {
        throw err;
    }
    console.log(`${colors.green(`Pushover: ${result}`)}`);
});

const online = [];
const offline = [];

// Verification du statut des chaines pour le tableau du console.log
function updateStreamStatuses(channelName, status) {
    if (status === 'online') {
        if (!online.includes(channelName)) {
            online.push(channelName);
        } // Ajoute la chaine au tableau online
        if (offline.includes(channelName)) {
            offline.splice(offline.indexOf(channelName), 1);
        } // Supprime la chaine du tableau offline
    } else {
        if (!offline.includes(channelName)) {
            offline.push(channelName);
        } // Ajoute la chaine au tableau offline
        if (online.includes(channelName)) {
            online.splice(online.indexOf(channelName), 1);
        } // Supprime la chaine du tableau online
    }

    let nextCheckTime = performance.now() + 300000; // Temps de la prochaine vérification
    const nextCheck = new Date(Date.now() + 300000).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    function updateProgressBar() {
        const now = performance.now();
        const timeLeft = Math.ceil((nextCheckTime - now) / 1000); // Temps restant en secondes
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const progressBarLength = 30;
        const progressBarFilled = Math.floor((300000 - (nextCheckTime - now)) / (300000 / progressBarLength)); 
        const progressBarEmpty = progressBarLength - progressBarFilled;
        const progressBar = "[" + "=".repeat(progressBarFilled) + " ".repeat(progressBarEmpty) + "]"; // Barre de progression

        console.clear();
        console.log(`${colors.green('Chaine(s)')} ${colors.green('en ligne:')} ${online.map(channelName => channelName ? channelName.yellow : '').join(', ')}\n\n${colors.red('Chaine(s)')} ${colors.red('hors ligne:')} ${offline.map(channelName => channelName ? channelName.yellow : '').join(', ')}\n`);
        console.log(`${colors.blue(`Prochaine vérification: ${nextCheck} | Restant: ${minutes}m ${seconds}s`)} ${colors.rainbow(`${progressBar}`)}`);

        if (timeLeft > 0) {
            setTimeout(updateProgressBar, 500); // Met à jour la barre de progression toutes les 500 millisecondes
        } else {
        console.log(colors.blue('Vérification en cours...'));
    }
}
updateProgressBar();
}

// Verification du statut des chaines pour pushover
async function checkStreamStatus(channelName) {
    try {
        const now = Date.now();
        accessToken = await getAccessToken();
        const url = `https://api.twitch.tv/helix/streams?user_login=${channelName}`;
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': TWITCH_CLIENT_ID,
        };
        const response = await axios.get(url, { headers });
        const data = response.data;
        const stream = data.data[0]; // Récupération des données de la chaine
        if (data.data.length > 0) {
            const startedAt = new Date(stream.started_at).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }); // Formatage de la date
            if (streamStatuses[channelName] === 'offline') { // Surveille si la chaine est offline
                push.send({
                    title: `${channelName} vient de lancer son stream !`,
                    message: `Jeu: ${stream.game_name}\n\nTitre: ${stream.title}\n\nViewers: ${stream.viewer_count}\n\nDate: ${startedAt}\n\nLien vers la chaine: https://www.twitch.tv/${channelName}`,
                    sound: 'magic',
                    priority: 0
                });
            }
            streamStatuses[channelName] = 'online';
            updateStreamStatuses(channelName, 'online');
        } else {
            if (streamStatuses[channelName] === 'online') { // Surveille si la chaine est online
                push.send({
                    title: `${channelName} vient de terminer son stream !`,
                    message: `Date: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`,
                    sound: 'magic',
                    priority: 0
                });
            }
            streamStatuses[channelName] = 'offline';
            updateStreamStatuses(channelName, 'offline');
        }
    } catch (error) {
        console.error(`${colors.red('Erreur lors de la vérification du statut du stream :', error)}`);
        if (!isErrorSent) {
            push.send({
                title: 'Erreur de connexion a twitch',
                message: `Le script n'a pas pu se connecter à Twitch : ${error.message}`,
                sound: 'siren',
                priority: 1
            }); // Message d'erreur si le script ne parvient pas se connecter à twitch
            isErrorSent = true;
        }
    }
}

// Rafraichissement des chaines
for (const channelName of TWITCH_CHANNEL_NAMES) {
    checkStreamStatus(channelName);
    setInterval(() => checkStreamStatus(channelName), 300000); // Rafraichie toutes les 5 minutes
}
checkStreamStatus();