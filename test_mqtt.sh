#!/bin/bash

BROKER="localhost"
PORT="1883"
TOPIC="sensores/medidas"
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Iniciando publicación MQTT en $BROKER:$PORT, topic: $TOPIC"

for i in {1..1000}
do
  T=$(( RANDOM % 100 /10 + 20))
  H=$(( RANDOM % 100 /10 + 80))

  mosquitto_pub -h $BROKER -p $PORT -t "$TOPIC" \
    -m "{\"localidad\":\"25Mayo\",\"prov\":\"BSAS\",\"temp\":${T},\"hum\":${H}}"
  log "[$i] 25Mayo -> temp=${T}, hum=${H}"
  sleep 1

  T=$(( RANDOM % 100 /10 + 20))
  H=$(( RANDOM % 100 /10 + 80))

  mosquitto_pub -h $BROKER -p $PORT -t "$TOPIC" \
    -m "{\"localidad\":\"Salto\",\"prov\":\"BSAS\",\"temp\":${T},\"hum\":${H}}"
  log "[$i] Salto   -> temp=${T}, hum=${H}"
  sleep 1

done

log "Publicación finalizada."

