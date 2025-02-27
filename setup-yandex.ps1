$ErrorActionPreference = "Stop"

function Show-Instructions {
    $instructions = @"
Guide étape par étape pour obtenir votre token OAuth:

1. Ouvrez ce lien dans votre navigateur:
   https://oauth.yandex.com/authorize?response_type=token&client_id=1a6990aa636648e9b2ef855fa7bec2fb

2. Connectez-vous à votre compte Yandex si ce n'est pas déjà fait

3. Cliquez sur 'Autoriser'

4. Vous serez redirigé vers une URL comme:
   https://oauth.yandex.ru/verification_code#access_token=y0_AgAAAA...

5. Copiez la partie après 'access_token=' (ça commence par y0_AgAAAA...)
"@
    Write-Host $instructions -ForegroundColor Yellow
}

function Get-YandexToken {
    $token = Read-Host "Collez votre token OAuth"
    if ($token -match '^y0_AgAAAA[A-Za-z0-9_-]{30,}$') {
        return $token
    }
    Write-Host "Token invalide! Il doit commencer par 'y0_AgAAAA'" -ForegroundColor Red
    return $null
}

function Save-TokenInfo {
    param($Token)
    
    $tokenInfo = @{
        token = $Token
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $tokenInfo | ConvertTo-Json | Set-Content -Path "yandex-token-info.json"
}

# Main script
Write-Host "Configuration initiale de Yandex Cloud..." -ForegroundColor Green
Show-Instructions

do {
    $token = Get-YandexToken
} while (-not $token)

Write-Host "Configuration de Yandex Cloud avec le token..." -ForegroundColor Blue

try {
    & yc config set token $token
    if ($LASTEXITCODE -eq 0) {
        Save-TokenInfo -Token $token
        Write-Host "Token validé avec succès ✓" -ForegroundColor Green
        Write-Host "Configuration réussie!" -ForegroundColor Green
        Write-Host "Vous pouvez maintenant exécuter .\deploy.ps1" -ForegroundColor Green
    }
    else {
        throw "Échec de la validation du token"
    }
}
catch {
    Write-Host "Erreur de configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
