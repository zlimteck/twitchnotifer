# twitchnotifer

Envoie un message pushover si un stream twitch est lancé / coupé des chaines twitch que vous surveillez

![alt text](https://zupimages.net/up/23/13/ksa0.png)

# Requirements

[![Foo](https://img.shields.io/badge/Node.js-Download-3ADC1A&?style=flat-square&logo=appveyor)](https://nodejs.org/en)
[![Foo](https://img.shields.io/badge/npm-Download-E13A18&?style=flat-square&logo=appveyor)](https://www.npmjs.com/get-npm)

# Configuration

1. Remplacer example.env par .env et ajoutez vos informations Twitch et Pushover ainsi que les chaines twitch que vous souhaitez surveiller.

2. Executer `npm install` pour installer les modules requis.

3. Executer le script avec `node twitchnotifer.js` !

Par défaut le script va refresh toute les 5 minutes libre à vous de modifier cette valeur a votre guise.

# Comment obtenir les informations Twitch et Pushover ?

## Twitch

1. Connectez vous sur [Twitch Développeur](https://dev.twitch.tv)
2. Allez dans votre console développeur (en haut a droite)
3. Allez dans "Applications"
4. Cliquez sur "Enregistrer votre application"
6. Remplissez les champs demandés
7. Cliquez sur "Créer"
8. Copiez le "Client ID" et le "Client Secret" et ajoutez les dans le fichier .env

9. Ensuite il vous faudras demander un code pour faire la requete qui permettra d'obtenir le refresh token.

- Changer le `client_id` par votre "Client ID" et le `redirect_uri`par votre "Redirect URI" dans l'url ci dessous

- `https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=channel:manage:broadcast`

10. Récuperer le code dans l'url de redirection
- Exemple: `http://localhost/?code=YOUR_CODE&scope=channel%3Amanage%3Abroadcast`

11. Faite une requete POST avec les paramètres suivant pour récuperer le refresh_token:
- `grant_type` : `authorization_code`
- `client_id` : votre "Client ID"
- `client_secret`: votre "Client Secret"
- `code`: le code obtenu dans l'étape 2
- `redirect_uri`: votre "Redirect URI"

12. Copiez votre "refresh_token" et ajoutez le dans le fichier .env

Methode alternative:
[Twitch Token Generator](https://twitchtokengenerator.com/)

## Pushover

1. Connectez vous sur [Pushover](https://pushover.net/)
2. Copier votre "Your User Key" et ajoutez le dans le fichier .env
3. Allez dans "Your Applications"
4. Cliquez sur "Create an Application / API Token"
5. Remplissez les champs comme vous le souhaitez
6. Cliquez sur "Create"
7. Copiez le "API Token" et ajoutez le dans le fichier .env