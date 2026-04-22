for i in {1..3600}
do
 T=$(( RANDOM % 100 /10 + 20))
 H=$(( RANDOM % 100 /10 + 80))

curl -i -XPOST 'http://localhost:8086/write?db=mydb' --data-binary \
 "medidas,localidad=25Mayo,prov=BSAS temp=${T},hum=${H}"
sleep 1

T=$(( RANDOM % 100 /10 + 20))
 H=$(( RANDOM % 100 /10 + 80))

curl -i -XPOST 'http://localhost:8086/write?db=mydb' --data-binary \
 "medidas,localidad=Salto,prov=BSAS temp=${T},hum=${H}"
sleep 1

done
