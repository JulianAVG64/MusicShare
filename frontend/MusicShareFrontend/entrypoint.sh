#!/bin/sh
set -e

# Imprime la variable para depuración
echo "API_URL is: $API_URL"

# Define la plantilla y el archivo de salida
TEMPLATE_FILE="/etc/nginx/conf.d/default.conf.template"
OUTPUT_FILE="/etc/nginx/conf.d/default.conf"

# Sustituye la variable de entorno y crea el archivo de configuración final
envsubst '$USERSERVICE_URL,$MUSICSERVICE_URL,$SOCIALSERVICE_URL' < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Nginx configuration updated:"
cat "$OUTPUT_FILE"

# Inicia Nginx en primer plano
exec nginx -g 'daemon off;'
