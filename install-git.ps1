Write-Host "Installation de Git..." -ForegroundColor Green

# Télécharger Git
$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
$installerPath = "$env:TEMP\GitInstaller.exe"

Write-Host "Téléchargement de Git..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $gitUrl -OutFile $installerPath

# Installer Git silencieusement
Write-Host "Installation de Git..." -ForegroundColor Cyan
Start-Process -FilePath $installerPath -Args "/VERYSILENT /NORESTART" -Wait

# Supprimer l'installateur
Remove-Item $installerPath

# Vérifier l'installation
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "`nGit installé avec succès!" -ForegroundColor Green
    Write-Host "Version de Git installée:" -ForegroundColor Cyan
    git --version
    
    Write-Host "`nMaintenant, vous pouvez exécuter init-github.ps1" -ForegroundColor Yellow
} else {
    Write-Error "L'installation de Git a échoué"
}
