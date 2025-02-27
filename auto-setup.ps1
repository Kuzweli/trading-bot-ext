# Configuration initiale
$ErrorActionPreference = 'Stop'

Write-Host "Configuration automatique du bot de trading..." -ForegroundColor Green

# 1. Configuration SSH
Write-Host "1. Configuration SSH..." -ForegroundColor Blue
.\setup-ssh.ps1

# 2. Installation des dépendances
Write-Host "2. Installation des dépendances..." -ForegroundColor Blue
npm install

# 3. Génération du token
Write-Host "3. Génération du token de sécurité..." -ForegroundColor Blue
$token = node generate-token.js
$config = Get-Content .\config.json | ConvertFrom-Json
$config.security.authToken = $token
$config | ConvertTo-Json -Depth 10 | Set-Content .\config.json

# 4. Configuration Yandex
Write-Host "4. Configuration Yandex Cloud..." -ForegroundColor Blue
.\deploy.ps1 -Verbose

Write-Host "Configuration terminée!" -ForegroundColor Green
Write-Host "Le serveur est prêt à être utilisé avec l'extension." -ForegroundColor Green
