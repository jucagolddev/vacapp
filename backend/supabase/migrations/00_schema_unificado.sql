-- ============================================================================
-- Migration: 00_schema_unificado.sql
-- Descripción: Esquema unificado (Initial + Sanidad + Pastoreo + Agua + TFG)
-- ============================================================================

-- Enable common extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Empresas
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    nif TEXT,
    telefono TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles (Auth Link)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('Propietario', 'Veterinario', 'Trabajador')),
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Fincas
CREATE TABLE fincas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    codigo_explotacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Lotes (Incluye Sanidad y Pastoreo Rotativo)
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    ubicacion TEXT,
    capacidad INTEGER,
    -- Extra Sanidad y TFG
    tipo VARCHAR(50) CHECK (tipo IN ('Cebo', 'Reposición', 'Venta', 'Sanitario', 'Potrero', 'Paridera', 'Box')),
    estado VARCHAR(50) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Cerrado')),
    -- Extra Pastoreo
    pasture_status VARCHAR(20) DEFAULT 'En Descanso' CHECK (pasture_status IN ('En Descanso', 'En Uso', 'Agotado')),
    current_batch_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    usage_start_date DATE,
    rest_start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bovinos (Incluye Categoría y Raza TFG)
CREATE TABLE bovinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crotal TEXT UNIQUE NOT NULL,
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    nombre TEXT,
    fecha_nacimiento DATE NOT NULL,
    sexo TEXT NOT NULL CHECK (sexo IN ('Macho', 'Hembra')),
    raza TEXT CHECK (raza IN ('Retinta', 'Limousin', 'F1_Cross') OR raza IS NULL),
    categoria VARCHAR(50) CHECK (categoria IN ('Vaca', 'Semental', 'Ternero', 'Descarte', 'Vaca Reproductora')),
    porcentaje_pureza NUMERIC(5,2) DEFAULT 100.00,
    aptitud TEXT CHECK (aptitud IN ('Carne', 'Leche', 'Doble Propósito', 'Trabajo/Lidia')),
    estado_productivo TEXT NOT NULL CHECK (estado_productivo IN ('Alta', 'Baja Venta', 'Baja Muerte', 'Baja Descarte')) DEFAULT 'Alta',
    estado_reproductivo TEXT CHECK (estado_reproductivo IN ('Vacía', 'Gestante', 'Lactante', 'Seca')) DEFAULT 'Vacía',
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    foto_url TEXT,
    padre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
    madre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
    coeficiente_consanguinidad NUMERIC(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Sementales
CREATE TABLE sementales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    raza TEXT,
    procedencia TEXT,
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Reproducción
CREATE TABLE reproduccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
    semental_id UUID REFERENCES sementales(id) ON DELETE SET NULL,
    fecha_celo DATE,
    fecha_cubricion DATE,
    tipo_cubricion TEXT CHECK (tipo_cubricion IN ('Monta Natural', 'Inseminación Artificial')),
    fecha_parto_prevista DATE,
    estado_gestacion TEXT NOT NULL CHECK (estado_gestacion IN ('Pendiente', 'Confirmada', 'Parido', 'Fallida')) DEFAULT 'Pendiente',
    observaciones_parto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sanidad (Incluye Trazabilidad)
CREATE TABLE sanidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Vacunación', 'Desparasitación', 'Tratamiento', 'Cirugía', 'Test/Diagnóstico')),
    producto TEXT NOT NULL,
    lote_medicamento TEXT,
    dias_retiro_carne INTEGER,
    dias_retiro_leche INTEGER,
    fecha_retiro DATE,
    observaciones TEXT,
    costo_aplicacion NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Pesajes
CREATE TABLE recria_pesajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
    fecha_pesaje DATE NOT NULL,
    peso_kg NUMERIC(6,2) NOT NULL,
    tipo_pesaje TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Finanzas
CREATE TABLE finanzas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
    categoria TEXT NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    bovino_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
    finca_id UUID REFERENCES fincas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Tareas
CREATE TABLE tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    bovino_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Completada', 'Omitida')) DEFAULT 'Pendiente',
    tipo_tarea TEXT,
    creada_por_sistema BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Abrevaderos (Agua)
CREATE TABLE abrevaderos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    capacidad_litros INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(50) NOT NULL DEFAULT 'Operativo' CHECK (estado IN ('Operativo', 'Vacío', 'Mantenimiento', 'Fuga')),
    ultima_limpieza DATE,
    nivel_llenado INTEGER DEFAULT 100 CHECK (nivel_llenado >= 0 AND nivel_llenado <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- TRIGGERS & RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_fincas_updated_at BEFORE UPDATE ON fincas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON lotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bovinos_updated_at BEFORE UPDATE ON bovinos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sementales_updated_at BEFORE UPDATE ON sementales FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reproduccion_updated_at BEFORE UPDATE ON reproduccion FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sanidad_updated_at BEFORE UPDATE ON sanidad FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recria_pesajes_updated_at BEFORE UPDATE ON recria_pesajes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_finanzas_updated_at BEFORE UPDATE ON finanzas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fincas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bovinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sementales ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproduccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE recria_pesajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE abrevaderos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÍNDICES & VISTAS (Pastoreo)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lotes_pasture_in_use ON lotes (usage_start_date) WHERE pasture_status = 'En Uso';
CREATE INDEX IF NOT EXISTS idx_lotes_pasture_resting ON lotes (rest_start_date) WHERE pasture_status = 'En Descanso';

CREATE OR REPLACE VIEW v_pasture_rotation_status AS
SELECT
    l.id, l.nombre, l.ubicacion, l.pasture_status, l.current_batch_id, lb.nombre AS batch_name,
    l.usage_start_date, l.rest_start_date,
    CASE WHEN l.pasture_status = 'En Uso' AND l.usage_start_date IS NOT NULL THEN (CURRENT_DATE - l.usage_start_date) ELSE NULL END AS dias_uso_actual,
    CASE WHEN l.pasture_status = 'En Descanso' AND l.rest_start_date IS NOT NULL THEN (CURRENT_DATE - l.rest_start_date) ELSE NULL END AS dias_descanso_actual,
    CASE WHEN l.pasture_status = 'En Uso' AND l.usage_start_date IS NOT NULL AND (CURRENT_DATE - l.usage_start_date) > 7 THEN TRUE ELSE FALSE END AS alerta_sobrepastoreo,
    CASE WHEN l.pasture_status = 'En Descanso' AND l.rest_start_date IS NOT NULL AND (CURRENT_DATE - l.rest_start_date) >= 21 THEN TRUE ELSE FALSE END AS listo_para_uso
FROM lotes l
LEFT JOIN lotes lb ON l.current_batch_id = lb.id
WHERE l.finca_id IS NOT NULL
ORDER BY l.pasture_status DESC, l.usage_start_date ASC;

-- ============================================================================
-- DATOS SEMILLA (Adaptados del TFG al esquema actual)
-- ============================================================================
DO $$
DECLARE
    v_empresa_id UUID;
    v_finca_id UUID;
    v_lote_dehesa UUID;
    v_lote_parideras UUID;
    v_lote_boxes UUID;
BEGIN
    -- 1. Insertar Empresa y Finca base
    INSERT INTO empresas (nombre) VALUES ('Ganadería TFG') RETURNING id INTO v_empresa_id;
    INSERT INTO fincas (empresa_id, nombre) VALUES (v_empresa_id, 'Finca Principal') RETURNING id INTO v_finca_id;

    -- 2. Insertar Ubicaciones (Lotes)
    INSERT INTO lotes (finca_id, nombre, tipo, capacidad) VALUES (v_finca_id, 'Dehesa Principal', 'Potrero', NULL) RETURNING id INTO v_lote_dehesa;
    INSERT INTO lotes (finca_id, nombre, tipo, capacidad) VALUES (v_finca_id, 'Cercado de Parideras', 'Paridera', 25) RETURNING id INTO v_lote_parideras;
    INSERT INTO lotes (finca_id, nombre, tipo, capacidad) VALUES (v_finca_id, 'Boxes Sementales', 'Box', 4) RETURNING id INTO v_lote_boxes;

    -- 3. Insertar Animales (Bovinos)
    -- 25 Vacas Retintas en Dehesa
    INSERT INTO bovinos (crotal, finca_id, lote_id, fecha_nacimiento, sexo, raza, categoria, estado_productivo)
    SELECT 
        'ES0100000000' || LPAD(i::text, 2, '0'), v_finca_id, v_lote_dehesa, CURRENT_DATE - INTERVAL '3 years', 'Hembra', 'Retinta', 'Vaca Reproductora', 'Alta'
    FROM generate_series(1, 25) AS i;

    -- 4 Toros Limousin en Boxes
    INSERT INTO bovinos (crotal, finca_id, lote_id, fecha_nacimiento, sexo, raza, categoria, estado_productivo)
    SELECT 
        'ES0200000000' || LPAD(i::text, 2, '0'), v_finca_id, v_lote_boxes, CURRENT_DATE - INTERVAL '4 years', 'Macho', 'Limousin', 'Semental', 'Alta'
    FROM generate_series(1, 4) AS i;

    -- 4. Insertar Transacciones Financieras (Finanzas)
    INSERT INTO finanzas (tipo, categoria, monto, fecha, descripcion, finca_id) VALUES
    ('Ingreso', 'Otros', 50000.00, CURRENT_DATE, 'Capital inicial / Subvención PAC', v_finca_id),
    ('Gasto', 'Alimentación', 4500.00, CURRENT_DATE, 'Compra de piensos', v_finca_id),
    ('Gasto', 'Veterinaria', 1200.00, CURRENT_DATE, 'Gastos veterinarios', v_finca_id);
END $$;


-- ============================================================================
-- POLÍTICAS DE ACCESO (MODO PRESENTACIÓN TFG)
-- ============================================================================
-- Permitimos acceso total a cualquier usuario autenticado para facilitar la demo

CREATE POLICY "Permitir todo a usuarios autenticados_empresas" ON empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_fincas" ON fincas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_lotes" ON lotes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_bovinos" ON bovinos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_sementales" ON sementales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_reproduccion" ON reproduccion FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_sanidad" ON sanidad FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_recria_pesajes" ON recria_pesajes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_finanzas" ON finanzas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_tareas" ON tareas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados_abrevaderos" ON abrevaderos FOR ALL TO authenticated USING (true) WITH CHECK (true);
