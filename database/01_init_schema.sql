-- Schema for Vacapp MVP (Version 1) - Multi-tenant update

-- 0.0 Perfiles de Usuario (Vinculados a Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  rol TEXT DEFAULT 'Propietario', -- Propietario, Veterinario, Trabajador
  empresa_id UUID, -- Se asignará a un UUID de empresas tras crearla
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 0. Empresas (Suscripciones principales)
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  nif TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 0.1 Fincas (Ubicaciones físicas de una empresa)
CREATE TABLE fincas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  ubicacion TEXT, -- Coordenadas o dirección
  codigo_explotacion TEXT, -- REGA en España
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Lotes (Groupings of animals within a Finca)
CREATE TABLE lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bovinos (Core cattle entities - ERP Avanzado)
CREATE TABLE bovinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crotal TEXT UNIQUE NOT NULL,
  nombre TEXT,
  fecha_nacimiento DATE NOT NULL,
  sexo TEXT CHECK (sexo IN ('Macho', 'Hembra')),
  
  -- Clasificaciones Zootécnicas Oficiales
  raza TEXT DEFAULT 'Cruce / Mestizo',
  porcentaje_pureza DECIMAL(5,2) DEFAULT 100.0, -- Ej: 50% Angus
  aptitud TEXT CHECK (aptitud IN ('Carne', 'Leche', 'Doble Propósito', 'Trabajo/Lidia')),
  estado_productivo TEXT DEFAULT 'Alta', -- Alta, Baja Venta, Baja Muerte, Baja Descarte
  estado_reproductivo TEXT, -- Solo hembras: Vacía, Gestante, Lactante, Seca
  
  finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  foto_url TEXT,
  
  -- Genealogía (Inteligencia Genética)
  padre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
  madre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
  coeficiente_consanguinidad DECIMAL(5,2) DEFAULT 0.0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sementales (Doses or Bulls used for crossing)
CREATE TABLE sementales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  raza TEXT,
  procedencia TEXT, -- Casa comercial o propio
  finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Reproduccion (Breeding and calving tracking)
-- Refactorizado para mayor detalle
CREATE TABLE reproduccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
  semental_id UUID REFERENCES sementales(id) ON DELETE SET NULL,
  fecha_cubricion DATE,
  tipo_cubricion TEXT CHECK (tipo_cubricion IN ('Monta Natural', 'Inseminación')),
  fecha_parto_prevista DATE,
  estado_gestacion TEXT DEFAULT 'Pendiente', -- Pendiente, Confirmada, Parido, Fallida
  observaciones_parto TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Cruces (Mating pairings)
CREATE TABLE cruces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madre_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
  padre_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
  fecha_cruce DATE DEFAULT CURRENT_DATE,
  exito BOOLEAN DEFAULT TRUE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Sanidad (Health events VIP)
CREATE TABLE sanidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT CHECK (tipo IN ('Vacunación', 'Desparasitación', 'Tratamiento', 'Cirugía', 'Test/Diagnóstico')),
  producto TEXT NOT NULL,
  lote_medicamento TEXT,
  dias_retiro_carne INTEGER DEFAULT 0,
  dias_retiro_leche INTEGER DEFAULT 0,
  observaciones TEXT,
  costo_aplicacion DECIMAL(10,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Recria (Feeding and Weights)
CREATE TABLE recria_pesajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
  fecha_pesaje DATE NOT NULL DEFAULT CURRENT_DATE,
  peso_kg DECIMAL(6,2) NOT NULL,
  tipo_pesaje TEXT CHECK (tipo_pesaje IN ('Nacimiento', 'Destete', 'Recría')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE alimentacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  tipo_racion TEXT NOT NULL,
  cantidad TEXT, -- e.g., "5kg/animal"
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Finanzas y Contabilidad Individual (ROI)
CREATE TABLE finanzas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
  categoria TEXT NOT NULL, -- Venta, Alimentación, Veterinaria, Adquisición, Otros
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT,
  bovino_id UUID REFERENCES bovinos(id) ON DELETE CASCADE, -- Ahora es tracking obligatorio individual cuando aplica
  finca_id UUID REFERENCES fincas(id) ON DELETE CASCADE, -- Para gastos generales de finca
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tareas Automáticas (Task Manager)
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id UUID NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
  bovino_id UUID REFERENCES bovinos(id) ON DELETE CASCADE, -- Si aplica a un animal
  titulo TEXT NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  estado TEXT DEFAULT 'Pendiente', -- Pendiente, Completada, Omitida
  tipo_tarea TEXT, -- Ej: Secado, Destete, Revacunación
  creada_por_sistema BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
