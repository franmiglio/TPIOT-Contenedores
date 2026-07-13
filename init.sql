CREATE TABLE IF NOT EXISTS contenedores (
    id SERIAL PRIMARY KEY,
    topic_mqtt VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    altura_cm NUMERIC(5, 2),
    latitud NUMERIC(14, 6),
    longitud NUMERIC(14, 6),
    piso VARCHAR(50),
    en_calibracion BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT true,
    fecha_instalacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);