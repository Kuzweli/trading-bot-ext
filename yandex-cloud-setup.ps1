Write-Host "Configuration de Yandex Cloud..." -ForegroundColor Green

# Récupérer le cloud-id et folder-id par défaut
$cloudId = yc config get cloud-id
$folderId = yc config get folder-id

if (!$cloudId -or !$folderId) {
    Write-Host "Exécution de yc init..." -ForegroundColor Yellow
    yc init
    $cloudId = yc config get cloud-id
    $folderId = yc config get folder-id
}

Write-Host "Cloud ID: $cloudId" -ForegroundColor Cyan
Write-Host "Folder ID: $folderId" -ForegroundColor Cyan

# Créer le réseau
Write-Host "Création du réseau..." -ForegroundColor Cyan
yc vpc network create `
    --name trading-bot-network `
    --folder-id $folderId `
    --description "Réseau pour le trading bot"

# Attendre quelques secondes
Start-Sleep -Seconds 5

# Créer le sous-réseau
Write-Host "Création du sous-réseau..." -ForegroundColor Cyan
yc vpc subnet create `
    --name trading-bot-subnet `
    --folder-id $folderId `
    --network-name trading-bot-network `
    --range 10.0.0.0/24 `
    --zone ru-central1-a

# Vérifier et afficher les images Ubuntu disponibles
Write-Host "`nImages Ubuntu disponibles:" -ForegroundColor Green
$ubuntuImages = yc compute image list --folder-id standard-images | Select-String "ubuntu"
$ubuntuImages | ForEach-Object { Write-Host $_ -ForegroundColor Cyan }

Write-Host "`nConfiguration terminée!" -ForegroundColor Green
