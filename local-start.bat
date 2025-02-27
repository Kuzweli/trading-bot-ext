@echo off
echo Démarrage du bot en local...
start chrome --new-window "https://bot.deriv.com"
timeout /t 5
npm start
