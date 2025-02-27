@echo off
echo Vérification des dépendances...
if not exist node_modules\ (
    echo Installation des dépendances...
    npm install
)

echo Démarrage du serveur...
npm start
pause
