$sshPath = "$env:USERPROFILE\.ssh"
$keyFile = "$sshPath\id_rsa"

# Créer le dossier .ssh s'il n'existe pas
if (!(Test-Path $sshPath)) {
    New-Item -ItemType Directory -Path $sshPath
}

# Générer la clé SSH si elle n'existe pas
if (!(Test-Path $keyFile)) {
    Write-Host "Génération de la clé SSH..." -ForegroundColor Green
    ssh-keygen -t rsa -b 4096 -f $keyFile -N '""'
}

# Afficher la clé publique
Get-Content "$keyFile.pub"

Write-Host "Copiez cette clé publique dans votre console Yandex Cloud" -ForegroundColor Yellow
