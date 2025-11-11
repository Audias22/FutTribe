-- Crear tabla usuarios para sistema de perfiles
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    nacionalidad VARCHAR(50) DEFAULT 'Internacional',
    avatar_id INT DEFAULT 1,
    puntos_totales INT DEFAULT 0,
    victorias_multijugador INT DEFAULT 0,
    once_ideal JSON,
    rol ENUM('jugador', 'admin') DEFAULT 'jugador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear índices para mejor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_puntos ON usuarios(puntos_totales DESC);

-- Insertar usuario admin por defecto (opcional)
INSERT IGNORE INTO usuarios (email, password_hash, nombre, rol) VALUES 
('admin@futtribe.com', '$2b$12$ejemplo.hash.para.admin', 'Administrador', 'admin');

SELECT 'Tabla usuarios creada exitosamente' as resultado;