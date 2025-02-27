@echo off
setlocal

echo Creation du dossier logs...
if not exist "logs" mkdir logs

echo Nettoyage du cache npm...
call npm cache clean --force

echo Suppression de pm2-sysmonit...
rmdir /s /q "node_modules\pm2-sysmonit" 2>nul

echo Installation des dependances...
call npm install --no-optional

echo Nettoyage des logs...
del /F /Q "logs\*.*" 2>nul

echo Demarrage du serveur...
set NODE_ENV=production
call node server.js

if errorlevel 1 (
    echo Erreur lors du demarrage du serveur
    type logs\error.log
    pause
    exit /b 1
)

endlocal
