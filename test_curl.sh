# ej.CURL
# http://host:port/query --data-urlencode '[QUERY]'

# CREA LA BASE DE DATOS
curl -i -XPOST http://localhost:8086/query --data-urlencode 'q=create database mydb'


# ESCRIBE
curl -i -XPOST 'http://localhost:8086/write?db=mydb'  --data-binary \
'medidas,localidad=Salto,prov="BsAs" temp=22.3,hum=92' 

curl -i -XPOST 'http://localhost:8086/write?db=mydb' --data-binary \ 'medidas,localidad=Rosario,prov='Santa Fe' temp=12.4,hum=90  1434055562000000000'

# LEE
curl -i -XPOST http://localhost:8086/query?db=mydb --data-urlencode 'q=select * from medidas'

# ESCRIBE DESDE UN ARCHIVO
curl -i -XPOST 'http://localhost:8086/write?db=mydb' --data-binary @test_salida.txt

