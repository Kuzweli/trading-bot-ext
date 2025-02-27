Write-Host "Configuration de Git..." -ForegroundColor Green

# Demander l'email
$email = Read-Host "Votre email GitHub"
$name = Read-Host "Votre nom complet"

# Configurer Git
git config --global user.email $email
git config --global user.name $name

# Vérifier la configuration
Write-Host "`nConfiguration Git actuelle:" -ForegroundColor Cyan
git config --list --global | Select-String "user"
