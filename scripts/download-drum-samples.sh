#!/bin/bash
# Script para baixar drum samples no deploy
# Adicione este comando no "Post Deploy" do Coolify:
# bash scripts/download-drum-samples.sh

set -e

SAMPLES_DIR="public/samples/drums"

# Se já existem samples, não baixa de novo
if [ -d "$SAMPLES_DIR/kick" ] && [ -d "$SAMPLES_DIR/snare" ]; then
    echo "Drum samples já existem, pulando download..."
    exit 0
fi

echo "Baixando drum samples..."

# Temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Clona o repo
git clone --depth 1 https://github.com/gregharvey/drum-samples.git

# Volta para o diretório do projeto
cd - > /dev/null

# Move as pastas para public/samples/drums/
mkdir -p "$SAMPLES_DIR"
mv "$TEMP_DIR/drum-samples/kick" "$SAMPLES_DIR/"
mv "$TEMP_DIR/drum-samples/snare" "$SAMPLES_DIR/"
mv "$TEMP_DIR/drum-samples/hihat-closed" "$SAMPLES_DIR/"
mv "$TEMP_DIR/drum-samples/crash" "$SAMPLES_DIR/"
mv "$TEMP_DIR/drum-samples/ride" "$SAMPLES_DIR/"
mv "$TEMP_DIR/drum-samples/tom" "$SAMPLES_DIR/"

# Limpa
rm -rf "$TEMP_DIR"

echo "Drum samples baixados com sucesso!"