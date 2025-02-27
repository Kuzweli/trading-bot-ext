
# 1. Installation du CLI Yandex Cloud
# Ouvrir PowerShell en tant qu'administrateur
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
iwr https://storage.yandexcloud.net/yandexcloud-yc/install.sh -UseBasicParsing | iex

# 2. Configuration de Yandex Cloud
yc init --federation-id b1gl0lk5gh4j12elp243

# 3. Obtenir la liste des instances et leurs IPs
yc compute instance list

# 4. Générer le token de sécurité
node generate-token.js

# 5. Trouver l'IP locale du robot
node find-ip.js

# 6. Tester la connexion (après avoir configuré config.json)
node test-connection.js

# 7. Déployer sur le serveur Yandex (remplacer YOUR_INSTANCE_IP par l'IP obtenue)
$YANDEX_IP = "YOUR_INSTANCE_IP"
scp -r ./* yc-user@${YANDEX_IP}:/home/yc-user/trading-bot/

# 8. Se connecter au serveur
ssh yc-user@${YANDEX_IP}

# Une fois connecté au serveur, exécuter ces commandes:
# cd /home/yc-user/trading-bot
# npm install
# npm install -g pm2
# pm2 start scheduler-service.js
# pm2 save
# pm2 startup
