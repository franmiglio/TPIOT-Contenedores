CREATE TABLE IF NOT EXISTS contenedores (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    altura_cm NUMERIC(5, 2),
    latitud NUMERIC(14, 6),
    longitud NUMERIC(14, 6),
    piso VARCHAR(50),
    en_calibracion BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_instalacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);