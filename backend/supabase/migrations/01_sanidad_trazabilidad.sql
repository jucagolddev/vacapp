-- Migration: 01_sanidad_trazabilidad.sql
-- Descripción: Actualización del esquema para trazabilidad y gestión sanitaria.
-- Alineado con la nomenclatura existente (bovinos, lotes, sanidad).

BEGIN;

-- ==============================================================================
-- 1. MODIFICACIÓN DE LA TABLA "lotes" (equivalente a "batches")
-- ==============================================================================
-- La tabla lotes ya existe (id, finca_id, nombre, etc.).
-- Añadimos las columnas 'tipo' y 'estado' solicitadas.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes' AND column_name = 'tipo') THEN
        ALTER TABLE lotes ADD COLUMN tipo VARCHAR(50) CHECK (tipo IN ('Cebo', 'Reposición', 'Venta', 'Sanitario'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes' AND column_name = 'estado') THEN
        ALTER TABLE lotes ADD COLUMN estado VARCHAR(50) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Cerrado'));
    END IF;
END $$;

COMMENT ON COLUMN lotes.tipo IS 'Clasificación del lote según su propósito productivo o sanitario.';
COMMENT ON COLUMN lotes.estado IS 'Estado operativo del lote.';


-- ==============================================================================
-- 2. MODIFICACIÓN DE LA TABLA "bovinos" (equivalente a "animals")
-- ==============================================================================
-- La columna lote_id (equivalente a batch_id) YA EXISTE en 00_initial_schema.sql.
-- Se verifica y añade restricción a raza y se crea la columna categoria.

DO $$
BEGIN
    -- Añadir columna categoria si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bovinos' AND column_name = 'categoria') THEN
        ALTER TABLE bovinos ADD COLUMN categoria VARCHAR(50) CHECK (categoria IN ('Vaca', 'Semental', 'Ternero', 'Descarte'));
    END IF;
END $$;

-- Documentación y restricción de la columna raza.
-- Como 'raza' ya es TEXT, podemos añadir una restricción CHECK. Si ya existen datos, 
-- se recomienda limpiar los datos antes, pero aquí definimos la regla.
ALTER TABLE bovinos DROP CONSTRAINT IF EXISTS bovinos_raza_check;
ALTER TABLE bovinos ADD CONSTRAINT bovinos_raza_check CHECK (raza IN ('Retinta', 'Limousin', 'F1_Cross') OR raza IS NULL);

COMMENT ON COLUMN bovinos.lote_id IS 'Llave foránea a la tabla lotes (batch_id). Permite asociar al animal a un lote específico.';
COMMENT ON COLUMN bovinos.raza IS 'Raza del bovino. Valores permitidos: Retinta, Limousin, F1_Cross.';
COMMENT ON COLUMN bovinos.categoria IS 'Categoría zootécnica del animal dentro de la explotación.';


-- ==============================================================================
-- 3. MODIFICACIÓN DE LA TABLA "sanidad" (equivalente a "health_records")
-- ==============================================================================
-- Añadimos lote_id para registrar tratamientos masivos y fecha_retiro para el tiempo de espera.

DO $$
BEGIN
    -- Añadir lote_id (batch_id) a sanidad
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sanidad' AND column_name = 'lote_id') THEN
        ALTER TABLE sanidad ADD COLUMN lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL;
    END IF;

    -- Añadir fecha_retiro (withdrawal_date)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sanidad' AND column_name = 'fecha_retiro') THEN
        ALTER TABLE sanidad ADD COLUMN fecha_retiro DATE;
    END IF;
END $$;

COMMENT ON COLUMN sanidad.lote_id IS 'Llave foránea a lotes para el registro de tratamientos masivos a todo un lote.';
COMMENT ON COLUMN sanidad.fecha_retiro IS 'Fecha límite del tiempo de espera del medicamento por seguridad alimentaria (withdrawal_date).';

COMMIT;
