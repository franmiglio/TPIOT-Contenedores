const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Influx = require('influx');

const app = express();
app.use(cors());
app.use(express.json());


const pgPool = new Pool({
    user: 'admin',
    host: 'postgres',
    database: 'tachos_db',
    password: 'admin',
    port: 5432,
});


const influx = new Influx.InfluxDB({
    host: 'influxdb',
    database: 'contenedores',
    port: 8086
});


app.get('/api/contenedores/estado', async (req, res) => {
    try {
        const pgResult = await pgPool.query('SELECT id, nombre, altura_cm FROM contenedores');
        const contenedores = pgResult.rows;

        const influxQuery = `SELECT LAST("porcentaje_llenado") AS porcentaje FROM "estado_contenedores" GROUP BY "contenedor_id"`;
        let influxResult = [];
        try {
            influxResult = await influx.query(influxQuery);
        } catch (e) {
            console.log("InfluxDB aún no tiene datos o la tabla no existe.");
        }

        const estadoFinal = contenedores.map(contenedor => {
            const telemetria = influxResult.find(r => r.contenedor_id === contenedor.id);
            return {
                ...contenedor,
                porcentaje: telemetria ? Math.round(telemetria.porcentaje) : 0
            };
        });

        res.json(estadoFinal);
    } catch (error) {
        console.error("Error al obtener estado:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


app.get('/api/contenedores/:id/altura', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pgPool.query('SELECT altura_cm FROM contenedores WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json({ altura_cm: result.rows[0].altura_cm });
        } else {
            res.status(404).json({ error: "Contenedor no encontrado en el inventario" });
        }
    } catch (error) {
        console.error("Error al obtener altura:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

app.post('/api/contenedores', async (req, res) => {
    const { id, nombre, altura_cm, latitud, longitud } = req.body;
    
    try {
        const query = `
            INSERT INTO contenedores (id, nombre, altura_cm, latitud, longitud) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        const alturaDb = altura_cm === "" ? null : altura_cm;
        
        const valores = [id, nombre, alturaDb, latitud || null, longitud || null];
        
        await pgPool.query(query, valores);
        res.status(201).json({ mensaje: "Contenedor registrado correctamente" });
        
    } catch (error) {
        console.error("Error al guardar el contenedor:", error);
        if (error.code === '23505') { 
            res.status(400).json({ error: "Ya existe un contenedor con ese ID" });
        } else {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
});

app.listen(3000, () => {
    console.log('API de Contenedores iniciada en puerto 3000');
});