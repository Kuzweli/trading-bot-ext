# Créer le dossier d'installation
$installDir = "$env:USERPROFILE\yandex-cloud"
New-Item -ItemType Directory -Force -Path $installDir

# Télécharger l'installateur Windows
$url = "https://storage.yandexcloud.net/yandexcloud-yc/install/stable/windows/yc.exe"
$output = "$installDir\yc.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Ajouter au PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
}

Write-Host "Yandex Cloud CLI installé dans $installDir"
Write-Host "Initialisation de Yandex Cloud..."

# Initialiser Yandex Cloud
& "$installDir\yc.exe" init
