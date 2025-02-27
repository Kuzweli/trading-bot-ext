Write-Host "Initialisation du dépôt GitHub..." -ForegroundColor Green

# Vérifier si Git est installé
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git n'est pas installé. Veuillez l'installer d'abord."
    exit 1
}

# Vérifier la configuration Git
if (!(git config --get user.email) -or !(git config --get user.name)) {
    Write-Error "Git n'est pas configuré. Exécutez d'abord setup-git-config.ps1"
    exit 1
}

# Demander le nom du dépôt
$repoName = Read-Host "Nom du dépôt GitHub (ex: trading-bot-scheduler)"

# Demander le nom d'utilisateur GitHub
$username = Read-Host "Votre nom d'utilisateur GitHub"

# Initialiser Git
Write-Host "`nInitialisation de Git..." -ForegroundColor Cyan
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Créer le dépôt sur GitHub
Write-Host "`nCréez un dépôt vide sur GitHub à cette URL:" -ForegroundColor Yellow
Write-Host "https://github.com/new" -ForegroundColor Cyan
Write-Host "Nom du dépôt: $repoName" -ForegroundColor Cyan
Write-Host "Appuyez sur une touche une fois le dépôt créé..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Configurer le remote et push
Write-Host "`nConfiguration du remote..." -ForegroundColor Cyan
git remote add origin "https://github.com/$username/$repoName.git"
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDépôt créé et code poussé avec succès!" -ForegroundColor Green
} else {
    Write-Error "Erreur lors du push. Vérifiez vos credentials GitHub"
}

Write-Host "URL du dépôt: https://github.com/$username/$repoName" -ForegroundColor Cyan
