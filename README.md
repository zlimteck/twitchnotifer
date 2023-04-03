# twitchnotifer

Envoie un message pushover si un stream twitch est lancé / coupé des chaines twitch que vous surveillez

![alt text](https://zupimages.net/up/23/13/ksa0.png)

# Requirements

[![Foo](https://img.shields.io/badge/Node.js-Download-3ADC1A&?style=flat-square&logo=appveyor)](https://nodejs.org/en)
[![Foo](https://img.shields.io/badge/npm-Download-E13A18&?style=flat-square&logo=appveyor)](https://www.npmjs.com/get-npm)

# Configuration

1. Remplacer example.env par .env et ajoutez vos informations Twitch et pushover.

2. Dans twitchnotifer.js ajouter les noms des chaines twitch à surveiller a la ligne 4.

3. Executer npm i pour installer les modules requis.

4. Executer le script !

Par défaut le script va refresh toute les 5 minutes libre à vous de modifier cette valeur a votre guise.