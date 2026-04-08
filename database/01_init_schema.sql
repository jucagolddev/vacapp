-- Schema for Vacapp MVP (Version 1)

-- 1. Lotes (Groupings of animals)
CREATE TABLE lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ubicacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bovinos (Core cattle entities)
-- Ahora con soporte para Genealogía (Padre y Madre)
CREATE TABLE bovinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crotal TEXT UNIQUE NOT NULL,
  nombre TEXT,
  fecha_nacimiento DATE NOT NULL,
  sexo TEXT CHECK (sexo IN ('Macho', 'Hembra')),
  raza TEXT,
  estado TEXT DEFAULT 'Activo', -- Activo, Vendido, Muerto
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  
  -- Genealogía (Relaciones familiares)
  padre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
  madre_id UUID REFERENCES bovinos(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sementales (Doses or Bulls used for crossing)
CREATE TABLE sementales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  raza TEXT,
  procedencia TEXT, -- Casa comercial o propio
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

-- 6. Sanidad (Health events)
CREATE TABLE sanidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bovino_id UUID NOT NULL REFERENCES bovinos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL, -- Vacuna, Desparasitación, Tratamiento, Saneamiento
  producto TEXT,
  observaciones TEXT,
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

-- 6. Finanzas (Economic summary)
CREATE TABLE finanzas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
  categoria TEXT NOT NULL, -- Venta, Alimentación, Veterinaria, Otros
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT,
  bovino_id UUID REFERENCES bovinos(id) ON DELETE SET NULL, -- Opcional, para ventas específicas
  created_at TIMESTAMPTZ DEFAULT now()
);
