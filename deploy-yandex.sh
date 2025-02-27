#!/bin/bash

# Installation de Yandex Cloud CLI
curl https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Authentification
yc init

# Création de l'instance
yc compute instance create \
  --name trading-bot-instance \
  --hostname trading-bot \
  --create-boot-disk image-family=ubuntu-2204-lts \
  --memory=2GB \
  --cores=2 \
  --core-fraction=20 \
  --preemptible \
  --network-interface subnet-name=default-subnet,nat-ip-version=ipv4 \
  --metadata-from-file user-data=cloud-init.yaml
