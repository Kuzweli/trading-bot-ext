Write-Host "Déploiement sur Yandex Cloud..." -ForegroundColor Green

# Vérifier que yc est installé
if (!(Get-Command yc -ErrorAction SilentlyContinue)) {
    Write-Error "Yandex Cloud CLI n'est pas installé. Exécutez d'abord install-yandex.ps1"
    exit 1
}

# Configuration
$folderId = "b1g57238u8ujvgrpohdh"  # Votre nouveau folder ID

# Vérification de l'authentification
Write-Host "Vérification de l'authentification..." -ForegroundColor Cyan
yc config set folder-id $folderId

# Créer l'instance
Write-Host "Création de l'instance..." -ForegroundColor Cyan
yc compute instance create `
    --name trading-bot-instance `
    --folder-id $folderId `
    --zone ru-central1-a `
    --create-boot-disk image-folder-id=standard-images,image-family=ubuntu-20-04-lts `
    --memory=2GB `
    --cores=2 `
    --core-fraction=20 `
    --platform-id "standard-v3" `
    --network-interface subnet-name=default-ru-central1-a

Write-Host "Configuration terminée!" -ForegroundColor Green

Write-Host "`nRécupération des informations de l'instance..." -ForegroundColor Cyan
yc compute instance get trading-bot-instance --format=json | ConvertFrom-Json | Select-Object -ExpandProperty network_interfaces | ForEach-Object {
    Write-Host "IP: $($_.primary_v4_address.address)" -ForegroundColor Green
}
