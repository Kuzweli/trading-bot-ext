#!/bin/bash

# Installation du CLI Yandex Cloud si pas déjà fait
curl https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Initialisation
yc init --federation-id b1gl0lk5gh4j12elp243

# Obtenir l'IP de l'instance
echo "Liste des instances et leurs IPs:"
yc compute instance list

# Obtenir les informations de connexion
echo "Informations de connexion SSH:"
yc compute instance get-serial-port-output --name YOUR_INSTANCE_NAME
