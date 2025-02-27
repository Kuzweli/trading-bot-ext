Write-Host "Installation de Yandex Cloud CLI..." -ForegroundColor Green

# Vérifier si le script est exécuté en tant qu'administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Ce script nécessite des droits administrateur. Relancement..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

# Créer le dossier d'installation
$installDir = "$env:USERPROFILE\yandex-cloud"
Write-Host "Création du dossier d'installation: $installDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

# Télécharger l'installateur Windows avec progression
$url = "https://storage.yandexcloud.net/yandexcloud-yc/install/stable/windows/yc.exe"
$output = "$installDir\yc.exe"
Write-Host "Téléchargement de Yandex Cloud CLI..." -ForegroundColor Cyan

try {
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($url, $output)
} catch {
    Write-Host "Erreur lors du téléchargement: $_" -ForegroundColor Red
    exit 1
}

# Vérifier que le fichier existe
if (!(Test-Path $output)) {
    Write-Host "Échec du téléchargement. Fichier non trouvé." -ForegroundColor Red
    exit 1
}

# Ajouter au PATH
Write-Host "Ajout au PATH système..." -ForegroundColor Cyan
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
    $env:Path = "$env:Path;$installDir"
}

Write-Host "`nYandex Cloud CLI installé avec succès!" -ForegroundColor Green
Write-Host "Localisation: $installDir" -ForegroundColor Green

# Initialiser Yandex Cloud
Write-Host "`nInitialisation de Yandex Cloud..." -ForegroundColor Cyan
try {
    & "$installDir\yc.exe" init
} catch {
    Write-Host "Erreur lors de l'initialisation: $_" -ForegroundColor Red
}

Write-Host "`nAppuyez sur une touche pour quitter..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
