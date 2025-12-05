#!/bin/bash
set -e

# 默认运行环境：development
app_env=${1:-development}

PROJECT_DIR="/home/devbox/project"

echo "[entrypoint] App env: $app_env"
echo "[entrypoint] Project dir: $PROJECT_DIR"

cd "$PROJECT_DIR"

# 如需在容器启动时自动安装依赖，可取消下面这一行注释
# echo "[entrypoint] Installing dependencies..."
# npm install

if [ "$app_env" = "production" ] || [ "$app_env" = "prod" ]; then
  echo "[entrypoint] Production environment detected, running: npm run start:prod"
  NODE_ENV=production npm run start:prod
else
  echo "[entrypoint] Development environment detected, running: npm run dev"
  NODE_ENV=development npm run dev
fi 



