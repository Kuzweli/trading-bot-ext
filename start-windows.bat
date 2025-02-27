@echo off
SET PATH=%PATH%;%USERPROFILE%\AppData\Roaming\npm
cd /d "%~dp0"

:: Installation des dépendances
call npm install

:: Démarrage du serveur avec PM2
call pm2 delete all
call pm2 start ecosystem.config.js
call pm2 save

:: Création du service Windows
call pm2-service-install -n "TradingBotService"

echo Service installé avec succès!
pause
