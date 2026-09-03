#!/bin/sh
set -e

# O volume /data no Coolify é montado como root-owned em runtime.
# chown DEVE acontecer aqui (runtime), não no build — USER root -> chown -> USER nextjs
# no Dockerfile não funciona porque o volume sobrescreve as permissões do build.
chown -R nextjs:nodejs /data

# Troca para usuário não-root e executa o CMD (node server.js)
exec su-exec nextjs "$@"
