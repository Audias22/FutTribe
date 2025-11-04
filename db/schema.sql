
-- 1. Tablas de Usuarios y Grupos
-- --------------------------------------------------------------------

CREATE DATABASE FutTribe_DB;

USE FutTribe_DB;

CREATE TABLE USUARIO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacena el hash de la contraseña (bcrypt)
    puntos_quiniela_totales INT DEFAULT 0,
    puntos_duelazo_totales INT DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE GRUPO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_grupo VARCHAR(100) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    puntos_duelazo_totales INT DEFAULT 0
);

CREATE TABLE USUARIO_GRUPO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    grupo_id INT NOT NULL,
    -- Un usuario solo puede estar en un grupo (Regla de negocio simple)
    UNIQUE KEY uk_usuario_grupo (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id),
    FOREIGN KEY (grupo_id) REFERENCES GRUPO(id)
);

-- 2. Tablas de Fútbol (Ligas, Equipos y Partidos - Sincronizado con API)
-- --------------------------------------------------------------------

CREATE TABLE LIGA (
    id INT PRIMARY KEY, -- ID de la API externa
    nombre VARCHAR(100) NOT NULL,
    pais VARCHAR(50) NOT NULL
);

CREATE TABLE EQUIPO (
    id INT PRIMARY KEY, -- ID de la API externa
    nombre VARCHAR(100) NOT NULL,
    liga_id INT NOT NULL,
    FOREIGN KEY (liga_id) REFERENCES LIGA(id)
);

CREATE TABLE PARTIDO (
    id INT PRIMARY KEY, -- ID de la API externa
    liga_id INT NOT NULL,
    equipo_local_id INT NOT NULL,
    equipo_visitante_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    marcador_l_final INT DEFAULT NULL,
    marcador_v_final INT DEFAULT NULL,
    estado VARCHAR(50) NOT NULL, -- Ej: Programado, Finalizado, En_Juego
    FOREIGN KEY (liga_id) REFERENCES LIGA(id),
    FOREIGN KEY (equipo_local_id) REFERENCES EQUIPO(id),
    FOREIGN KEY (equipo_visitante_id) REFERENCES EQUIPO(id)
);

-- Tabla de Eventos: Crucial para el módulo Duelazo (Lógica de Secuencia)
CREATE TABLE EVENTO_PARTIDO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partido_id INT NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL, -- Ej: Gol, Tarjeta_Amarilla, Tarjeta_Roja
    minuto INT NOT NULL, -- Dato clave para ordenar y validar la secuencia
    equipo_id INT NOT NULL, -- Equipo que generó el evento
    FOREIGN KEY (partido_id) REFERENCES PARTIDO(id),
    FOREIGN KEY (equipo_id) REFERENCES EQUIPO(id)
);

-- 3. Módulo Quiniela (Predicción Individual)
-- --------------------------------------------------------------------

CREATE TABLE PREDICCION (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    partido_id INT NOT NULL,
    marcador_l_pred INT NOT NULL,
    marcador_v_pred INT NOT NULL,
    puntos_obtenidos INT DEFAULT 0,
    fecha_prediccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Restricción: Un usuario solo predice un partido una vez
    UNIQUE KEY uk_prediccion (usuario_id, partido_id),
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id),
    FOREIGN KEY (partido_id) REFERENCES PARTIDO(id)
);

-- 4. Módulo Duelazo de la Jornada (Grupos)
-- --------------------------------------------------------------------

-- Tabla de Preguntas de Fútbol para el Duelazo
CREATE TABLE preguntas_futbol (
    id VARCHAR(10) PRIMARY KEY,
    pregunta TEXT NOT NULL,
    opcion_a VARCHAR(200) NOT NULL,
    opcion_b VARCHAR(200) NOT NULL,
    opcion_c VARCHAR(200) NOT NULL,
    opcion_d VARCHAR(200) NOT NULL,
    respuesta_correcta VARCHAR(200) NOT NULL,
    dificultad ENUM('facil', 'intermedia', 'avanzada') NOT NULL,
    INDEX idx_dificultad (dificultad)
);

-- Tabla de Salas Multijugador para El Duelazo
CREATE TABLE salas_duelazo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(6) NOT NULL UNIQUE,
    nombre_creador VARCHAR(100) NOT NULL,
    estado ENUM('esperando', 'jugando_ronda1', 'jugando_final', 'finalizado') DEFAULT 'esperando',
    max_jugadores INT DEFAULT 10,
    ganador VARCHAR(100) DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_codigo (codigo),
    INDEX idx_estado (estado)
);

-- Tabla de Jugadores en Sala
CREATE TABLE jugadores_sala (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sala_id INT NOT NULL,
    nombre_jugador VARCHAR(100) NOT NULL,
    socket_id VARCHAR(100) NOT NULL,
    esta_listo BOOLEAN DEFAULT FALSE,
    puntuacion_ronda1 INT DEFAULT 0,
    puntuacion_final INT DEFAULT 0,
    puntuacion_total INT DEFAULT 0,
    clasifico_final BOOLEAN DEFAULT FALSE,
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sala_id) REFERENCES salas_duelazo(id) ON DELETE CASCADE,
    INDEX idx_sala (sala_id)
);

-- Tabla de Respuestas de Jugadores
CREATE TABLE respuestas_jugador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jugador_sala_id INT NOT NULL,
    pregunta_id VARCHAR(10) NOT NULL,
    respuesta VARCHAR(200) NOT NULL,
    es_correcta BOOLEAN NOT NULL,
    puntos_ganados INT NOT NULL,
    tiempo_respuesta INT NOT NULL,
    ronda ENUM('ronda1', 'final') NOT NULL,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jugador_sala_id) REFERENCES jugadores_sala(id) ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas_futbol(id),
    INDEX idx_jugador (jugador_sala_id)
);

CREATE TABLE DUELAZO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partido_id INT NOT NULL,
    pregunta_texto TEXT NOT NULL, -- Ej: "¿Qué equipo recibe la primera amarilla?"
    opcion_a VARCHAR(100), -- Ej: ID o Nombre del Equipo Local
    opcion_b VARCHAR(100), -- Ej: ID o Nombre del Equipo Visitante
    respuesta_real_evento VARCHAR(100) DEFAULT NULL, -- Almacena la respuesta real (Ej: 'EQUIPO_LOCAL_ID')
    FOREIGN KEY (partido_id) REFERENCES PARTIDO(id)
);

CREATE TABLE VOTO_DUELAZO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grupo_id INT NOT NULL,
    duelazo_id INT NOT NULL,
    opcion_elegida VARCHAR(100) NOT NULL, -- Debe coincidir con Opción A o B del Duelazo
    puntos_obtenidos INT DEFAULT 0,
    -- Restricción: Un grupo vota una vez por Duelazo
    UNIQUE KEY uk_voto_duelazo (grupo_id, duelazo_id),
    FOREIGN KEY (grupo_id) REFERENCES GRUPO(id),
    FOREIGN KEY (duelazo_id) REFERENCES DUELAZO(id)
);

-- 5. Módulo Once Histórico Dinámico (Votación Social)
-- --------------------------------------------------------------------

CREATE TABLE JUGADOR_HISTORICO (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL, -- Ej: GK, CB, MC
    -- La URL de la imagen se almacena aquí directamente.
    image_path VARCHAR(500) NOT NULL 
);

CREATE TABLE VOTO_ALINEACION (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE, -- Un usuario solo puede tener una alineación activa para votar
    fecha_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id)
);

CREATE TABLE JUGADOR_VOTO_HISTORICO (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voto_alineacion_id INT NOT NULL,
    jugador_historico_id INT NOT NULL,
    posicion_elegida VARCHAR(50) NOT NULL, -- Posición asignada en el campo (Ej: CB_L, MC_R)
    -- Restricción: Un jugador solo puede ser votado en una posición por alineación
    UNIQUE KEY uk_jugador_posicion (voto_alineacion_id, jugador_historico_id),
    FOREIGN KEY (voto_alineacion_id) REFERENCES VOTO_ALINEACION(id),
    FOREIGN KEY (jugador_historico_id) REFERENCES JUGADOR_HISTORICO(id)
);