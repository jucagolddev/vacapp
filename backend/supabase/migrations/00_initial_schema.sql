-- 00_initial_schema.sql
-- Vacapp ERP: Healthcare & Farm Management System

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

-- 2. User Profiles (Auth Link)
CREATE TABLE user_profiles (
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

-- 4. Lotes
CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    ubicacion TEXT,
    capacidad INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bovinos
CREATE TABLE bovinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crotal TEXT UNIQUE NOT NULL,
    finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    nombre TEXT,
    fecha_nacimiento DATE NOT NULL,
    sexo TEXT NOT NULL CHECK (sexo IN ('Macho', 'Hembra')),
    
    -- ERP Attributes
    raza TEXT,
    porcentaje_pureza NUMERIC(5,2) DEFAULT 100.00,
    aptitud TEXT CHECK (aptitud IN ('Carne', 'Leche', 'Doble Propósito', 'Trabajo/Lidia')),
    estado_productivo TEXT NOT NULL CHECK (estado_productivo IN ('Alta', 'Baja Venta', 'Baja Muerte', 'Baja Descarte')) DEFAULT 'Alta',
    estado_reproductivo TEXT CHECK (estado_reproductivo IN ('Vacía', 'Gestante', 'Lactante', 'Seca')) DEFAULT 'Vacía',
    
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    foto_url TEXT,
    
    -- Genealogía
    padre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
    madre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
    coeficiente_consanguinidad NUMERIC(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Sementales (Externos o Propios)
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

-- 8. Sanidad
CREATE TABLE sanidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Vacunación', 'Desparasitación', 'Tratamiento', 'Cirugía', 'Test/Diagnóstico')),
    producto TEXT NOT NULL,
    lote_medicamento TEXT,
    dias_retiro_carne INTEGER,
    dias_retiro_leche INTEGER,
    observaciones TEXT,
    costo_aplicacion NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Pesajes (Recría/Control)
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
    categoria TEXT NOT NULL, -- Venta, Alimentación, Veterinaria, Adquisición, Otros
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

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_fincas_updated_at BEFORE UPDATE ON fincas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON lotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bovinos_updated_at BEFORE UPDATE ON bovinos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sementales_updated_at BEFORE UPDATE ON sementales FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reproduccion_updated_at BEFORE UPDATE ON reproduccion FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sanidad_updated_at BEFORE UPDATE ON sanidad FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recria_pesajes_updated_at BEFORE UPDATE ON recria_pesajes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_finanzas_updated_at BEFORE UPDATE ON finanzas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) - Basic Enable
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fincas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bovinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sementales ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproduccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE recria_pesajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
