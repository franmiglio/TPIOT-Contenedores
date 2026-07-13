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
        const pgResult = await pgPool.query('SELECT id, topic_mqtt, nombre, altura_cm, longitud, latitud, piso FROM contenedores WHERE activo = true');
        const contenedores = pgResult.rows;

        const influxQuery = `SELECT LAST("porcentaje_llenado") AS porcentaje FROM "estado_contenedores" GROUP BY "contenedor_id"`;
        let influxResult = [];
        try {
            influxResult = await influx.query(influxQuery);
        } catch (e) {
            console.log("InfluxDB aún no tiene datos o la tabla no existe.");
        }

        const estadoFinal = contenedores.map(contenedor => {
            const telemetria = influxResult.find(r => String(r.contenedor_id) === String(contenedor.id));
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
        const result = await pgPool.query('SELECT altura_cm, en_calibracion FROM contenedores WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json({ 
                altura_cm: result.rows[0].altura_cm,
                en_calibracion: result.rows[0].en_calibracion
            });
        } else {
            res.status(404).json({ error: "Contenedor no encontrado en el inventario" });
        }
    } catch (error) {
        console.error("Error al obtener altura:", error);
        res.status(500).json({ error: "Error interno" });
    }
});

app.post('/api/contenedores', async (req, res) => {
    const { topic_mqtt, nombre, altura_cm, latitud, longitud, piso } = req.body;
    
    try {
        const query = `
            INSERT INTO contenedores (topic_mqtt, nombre, altura_cm, latitud, longitud, piso) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const alturaDb = altura_cm === "" ? null : altura_cm;
        
        const valores = [topic_mqtt, nombre, alturaDb, latitud || null, longitud || null, piso];
        
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

app.put('/api/contenedores/:id/calibrar', async (req, res) => {
    const { id } = req.params;
    try {
        await pgPool.query('UPDATE contenedores SET en_calibracion = TRUE WHERE id = $1', [id]);
        res.json({ mensaje: "Modo calibración activado. Esperando lectura del sensor..." });
    } catch (error) {
        console.error("Error al activar calibración:", error);
        res.status(500).json({ error: "Error interno" });
    }
});
app.put('/api/contenedores/:id/altura', async (req, res) => {
    const { id } = req.params;
    const { altura_cm } = req.body;

    try {
        await pgPool.query(
            'UPDATE contenedores SET altura_cm = $1, en_calibracion = FALSE WHERE id = $2', 
            [altura_cm, id]
        );
        res.json({ mensaje: "Contenedor calibrado exitosamente" });
    } catch (error) {
        console.error("Error al guardar la calibración:", error);
        res.status(500).json({ error: "Error interno" });
    }
});
app.get('/api/contenedores/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pgPool.query('SELECT topic_mqtt, nombre, piso, altura_cm FROM contenedores WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: "Contenedor no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error interno" });
    }
});

app.put('/api/contenedores/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, piso, altura_cm } = req.body;
    try {
        await pgPool.query('UPDATE contenedores SET nombre = $1, piso = $2, altura_cm = $3 WHERE id = $4', [nombre, piso, altura_cm, id]);
        res.json({ mensaje: "Datos actualizados correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});
app.get('/api/contenedores/:id/estadisticas', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT "porcentaje_llenado" FROM "estado_contenedores" WHERE "contenedor_id" = '${id}' AND time > now() - 7d`;
        const datos = await influx.query(query);

        if (datos.length === 0) {
            return res.json({ vaciados: 0, promedio_horas: "Sin datos suficientes" });
        }

        let vaciados = 0;
        for (let i = 1; i < datos.length; i++) {
            if (datos[i-1].porcentaje_llenado > 50 && datos[i].porcentaje_llenado < 20) {
                vaciados++;
            }
        }
        let promedio = vaciados > 0 ? Math.round((7 * 24) / vaciados) : "Más de 7 días";

        res.json({ vaciados: vaciados, promedio_horas: promedio });
    } catch (error) {
        console.error("Error en InfluxDB:", error);
        res.status(500).json({ error: "Error al calcular estadísticas" });
    }
});
app.put('/api/contenedores/:id/ubicacion', async (req, res) => {
    const { id } = req.params;
    const { latitud, longitud } = req.body;
    try {
        await pgPool.query('UPDATE contenedores SET latitud = $1, longitud = $2 WHERE id = $3', [latitud, longitud, id]);
        res.json({ mensaje: "Ubicación actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar la ubicación" });
    }
});
app.put('/api/contenedores/:id/desactivar', async (req, res) => {
    const { id } = req.params;
    try {
        await pgPool.query('UPDATE contenedores SET activo = false WHERE id = $1', [id]);
        res.json({ mensaje: "Contenedor eliminado lógicamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el contenedor" });
    }
});
app.get('/api/contenedores/topic/:topic', async (req, res) => {
    const { topic } = req.params;
    try {
        const result = await pgPool.query(
            'SELECT id, nombre, altura_cm, en_calibracion FROM contenedores WHERE topic_mqtt = $1 AND activo = true',
            [topic]
        );
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: "Contenedor no encontrado o inactivo" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});
app.listen(3000, () => {
    console.log('API de Contenedores iniciada en puerto 3000');
});