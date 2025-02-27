#!/bin/bash
docker build -t trading-bot .
docker tag trading-bot cr.yandex/your-registry-id/trading-bot
docker push cr.yandex/your-registry-id/trading-bot
yc compute instance create-with-container trading-bot-instance --docker-image cr.yandex/your-registry-id/trading-bot
