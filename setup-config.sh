#!/usr/bin/env bash
# Генерирует Revolt.toml из шаблона и .env файла
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
TEMPLATE="$SCRIPT_DIR/Revolt.toml.template"
OUTPUT="$SCRIPT_DIR/Revolt.toml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Ошибка: файл .env не найден."
  echo "Скопируйте .env.example в .env и заполните значениями:"
  echo "  cp .env.example .env"
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "Ошибка: шаблон Revolt.toml.template не найден."
  exit 1
fi

# Загружаем переменные из .env (игнорируя комментарии и пустые строки)
set -a
# shellcheck disable=SC1090
source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$')
set +a

# Проверяем обязательные переменные
REQUIRED_VARS=(
  PLG_VOICE_HOST MONGO_USER MONGO_PASS
  VAPID_PRIVATE_KEY VAPID_PUBLIC_KEY
  FILES_ENCRYPTION_KEY LIVEKIT_KEY LIVEKIT_SECRET
)

missing=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ] || [[ "${!var}" == changeme* ]]; then
    echo "⚠ Переменная $var не задана или содержит placeholder"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  echo ""
  echo "Заполните все переменные в .env перед генерацией."
  echo "Продолжить с текущими значениями? (y/N)"
  read -r answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    exit 1
  fi
fi

# Генерируем Revolt.toml через envsubst
envsubst < "$TEMPLATE" > "$OUTPUT"

echo "✓ Revolt.toml сгенерирован из шаблона."
echo "  Проверьте: cat $OUTPUT"
