# Fonction pour vérifier si une commande existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Amélioration de la vérification de l'installation
if (-not (Test-Command yc)) {
    Write-Host "Installation de Yandex Cloud CLI..." -ForegroundColor Yellow
    
    # Créer un fichier de réponse automatique
    $autoResponse = @"
Y
"@
    
    # Sauvegarder la réponse dans un fichier temporaire
    $tempFile = [System.IO.Path]::GetTempFileName()
    $autoResponse | Set-Content $tempFile
    
    # Démarrer l'installation avec réponse automatique
    Start-Process powershell -ArgumentList "Get-Content $tempFile | iwr https://storage.yandexcloud.net/yandexcloud-yc/install.ps1 -UseBasicParsing | iex" -NoNewWindow -Wait
    
    # Nettoyer le fichier temporaire
    Remove-Item $tempFile -Force
    
    # Mettre à jour le PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
    
    $maxWaitTime = 300 # 5 minutes max
    $progress = 0
    
    # Afficher la progression
    while (-not (Test-Command yc) -and $progress -lt $maxWaitTime) {
        $percent = [math]::Round(($progress / $maxWaitTime) * 100)
        Write-Progress -Activity "Installation du CLI Yandex Cloud" -Status "$percent% Complet" -PercentComplete $percent
        Start-Sleep -Seconds 1
        $progress++
    }
    
    Write-Progress -Activity "Installation du CLI Yandex Cloud" -Completed
    
    if (-not (Test-Command yc)) {
        Write-Error "L'installation a échoué après $maxWaitTime secondes"
        exit 1
    }
    
    Write-Host "Installation terminée!" -ForegroundColor Green
}

# Vérifier la configuration
$config = Get-Content -Raw -Path .\config.json | ConvertFrom-Json
if (-not $config.yandex.organizationId) {
    Write-Error "Configuration Yandex manquante"
    exit 1
}

try {
    # Vérification des credentials Yandex...
    Write-Host "Vérification des credentials Yandex..." -ForegroundColor Blue
    
    # Récupération des informations de configuration
    $configOutput = yc config list
    $token = ($configOutput | Select-String "token: (.+)").Matches.Groups[1].Value
    $cloudId = ($configOutput | Select-String "cloud-id: (.+)").Matches.Groups[1].Value
    $folderId = ($configOutput | Select-String "folder-id: (.+)").Matches.Groups[1].Value
    
    if (-not $token) {
        throw "Token non trouvé. Exécutez à nouveau setup-yandex.ps1"
    }

    Write-Host "Authentification vérifiée ✓" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,10))..." -ForegroundColor Green
    Write-Host "Cloud ID: $cloudId" -ForegroundColor Green
    
    # Création de l'instance si elle n'existe pas
    $instanceListOutput = yc compute instance list
    $instanceExists = $instanceListOutput | Select-String $config.yandex.instanceName
    
    if (-not $instanceExists) {
        Write-Host "Création d'une nouvelle instance..." -ForegroundColor Yellow
        
        # Création de l'instance
        $createInstanceCommand = @"
            yc compute instance create `
            --name $($config.yandex.instanceName) `
            --zone ru-central1-a `
            --ssh-key '$($config.yandex.sshKeyPath)' `
            --create-boot-disk image-folder-id=standard-images,image-family=ubuntu-20-04-lts `
            --network-interface subnet-name=default-ru-central1-a,nat-ip-version=ipv4 `
            --memory 2GB
"@
        
        Invoke-Expression $createInstanceCommand
    }

    # Configuration de Yandex Cloud...
    Write-Host "Configuration de Yandex Cloud..." -ForegroundColor Green
    yc config set organization-id $config.yandex.organizationId
    yc config set cloud-id $config.yandex.cloudId
    yc config set folder-name $config.yandex.folderName

    # Vérification de l'instance
    Write-Host "Vérification de l'instance..." -ForegroundColor Green
    $instance = yc compute instance get $config.yandex.instanceName --format json
    if (-not $instance) {
        Write-Error "Instance non trouvée"
        exit 1
    }

    # Déploiement
    $instanceIP = ($instance | ConvertFrom-Json).network_interfaces[0].primary_v4_address.one_to_one_nat.address
    Write-Host "Déploiement vers $instanceIP..." -ForegroundColor Green
    
    # Création d'un package de déploiement
    Write-Host "Création du package..." -ForegroundColor Green
    Compress-Archive -Path * -DestinationPath deploy.zip -Force
    
    # Déploiement via SCP
    Write-Host "Transfert des fichiers..." -ForegroundColor Green
    scp -o StrictHostKeyChecking=no deploy.zip "yc-user@${instanceIP}:$($config.yandex.deployPath)"
    
    # Exécution du déploiement
    Write-Host "Configuration du serveur..." -ForegroundColor Green
    $deployCommand = @"
        cd $($config.yandex.deployPath)
        unzip -o deploy.zip
        npm install
        pm2 restart all
"@
    
    ssh -o StrictHostKeyChecking=no "yc-user@${instanceIP}" $deployCommand
    
    Write-Host "Déploiement terminé avec succès!" -ForegroundColor Green
} catch {
    Write-Error "Erreur lors du déploiement: $_"
    Write-Host "Détails de l'erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
