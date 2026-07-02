CREATE TABLE IF NOT EXISTS contenedores (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    altura_cm NUMERIC(5, 2),
    latitud NUMERIC(10, 8),
    longitud NUMERIC(11, 8),
    en_calibracion BOOLEAN DEFAULT FALSE,
    fecha_instalacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);