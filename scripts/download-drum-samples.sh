#!/bin/bash
# Script para baixar drum samples no deploy
# Rode manualmente uma vez ou adicione no pre-deploy do Coolify

set -e

SAMPLES_DIR="/app/public/samples/drums"

# Se já existem samples, não baixa de novo
if [ -d "$SAMPLES_DIR/kick" ] && [ -d "$SAMPLES_DIR/snare" ]; then
    echo "Drum samples já existem em $SAMPLES_DIR, pulando download..."
    exit 0
fi

echo "Baixando drum samples..."

# Cria diretório
mkdir -p "$SAMPLES_DIR"

# Temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Clona o repo
git clone --depth 1 https://github.com/gregharvey/drum-samples.git

# Move as pastas
cp -r drum-samples/kick "$SAMPLES_DIR/"
cp -r drum-samples/snare "$SAMPLES_DIR/"
cp -r drum-samples/hihat-closed "$SAMPLES_DIR/"
cp -r drum-samples/crash "$SAMPLES_DIR/"
cp -r drum-samples/ride "$SAMPLES_DIR/"
cp -r drum-samples/tom "$SAMPLES_DIR/"

# Limpa
rm -rf "$TEMP_DIR"

echo "Drum samples baixados com sucesso!"