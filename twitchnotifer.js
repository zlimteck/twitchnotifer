const axios = require('axios');
const Push = require('pushover-notifications');
require('dotenv').config();
const TWITCH_CHANNEL_NAMES = process.env.TWITCH_CHANNEL_NAMES.split(','); //Liste des chaines à surveiller
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
} console.log(`Connexion à Twitch: OK\n${TWITCH_CHANNEL_NAMES.length} chaines à surveiller`);

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
    console.log(`Pushover: ${result}`);
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
    console.clear();
    console.log(`Chaine(s) en ligne: ${online.join(', ')}\n\nChaine(s) hors ligne: ${offline.join(', ')}\n`);
    const nextCheck = new Date(Date.now() + 300000).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    console.log(`Prochaine vérification: ${nextCheck}`); // Affiche l'heure de la prochaine vérification
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
                    message: `Jeu: ${stream.game_name}\n\nTitre: ${stream.title}\n\nViewers: ${stream.viewer_count}\n\nDate: ${startedAt}`,
                    url: `https://www.twitch.tv/${channelName}`,
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
        console.error('Erreur lors de la vérification du statut du stream :', error);
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