# Trading Bot Scheduler

Bot de trading automatisé pour Deriv avec planification des exécutions.

## Installation

## Configuration sur Yandex Cloud

1. Connectez-vous à votre serveur Yandex:
```bash
ssh username@your-yandex-server
```

2. Installez Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Transférez les fichiers:
```bash
scp -r ./* username@your-yandex-server:/path/to/scheduler/
```

4. Installez les dépendances:
```bash
npm install
```

5. Démarrez le service avec PM2:
```bash
npm install -g pm2
pm2 start scheduler-service.js
pm2 startup
pm2 save
```

## Configuration du Robot

1. Assurez-vous que votre robot est accessible via une IP fixe
2. Modifiez l'URL dans scheduler-service.js pour pointer vers votre robot
3. Configurez votre routeur pour autoriser les connexions entrantes sur le port du robot

## Sécurité

1. Configurez un pare-feu sur votre serveur
2. Utilisez HTTPS pour les communications
3. Ajoutez une authentification pour l'API
