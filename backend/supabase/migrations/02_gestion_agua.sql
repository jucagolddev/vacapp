-- =========================================================================================
-- MIGRACIÓN: Control de Recursos Hídricos (Bioseguridad y Sequía)
-- Descripción: Creación de la tabla para gestión de abrevaderos y depósitos de agua.
-- Creado para: Vacapp (Gestión Ganadera y Trazabilidad REGA)
-- =========================================================================================

-- Creamos la tabla 'abrevaderos' (manteniendo la nomenclatura en español del resto de la BD)
CREATE TABLE IF NOT EXISTS public.abrevaderos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL, -- ej: 'Abrevadero Norte', 'Depósito Parideras'
    lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL, -- FK a la tabla de recintos (location_id)
    capacidad_litros INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(50) NOT NULL DEFAULT 'Operativo' CHECK (estado IN ('Operativo', 'Vacío', 'Mantenimiento', 'Fuga')),
    ultima_limpieza DATE, -- Control de bioseguridad del agua
    nivel_llenado INTEGER DEFAULT 100 CHECK (nivel_llenado >= 0 AND nivel_llenado <= 100), -- Porcentaje
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================================
-- CONFIGURACIÓN DE SEGURIDAD A NIVEL DE FILA (RLS)
-- =========================================================================================

-- 1. Habilitamos RLS en la tabla
ALTER TABLE public.abrevaderos ENABLE ROW LEVEL SECURITY;

-- 2. Política de LECTURA: Cualquier usuario autenticado puede ver los abrevaderos
CREATE POLICY "Permitir lectura de abrevaderos a usuarios autenticados" 
    ON public.abrevaderos 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- 3. Política de INSERCIÓN: Usuarios autenticados pueden registrar nuevos abrevaderos
CREATE POLICY "Permitir creación de abrevaderos a usuarios autenticados" 
    ON public.abrevaderos 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- 4. Política de ACTUALIZACIÓN: Usuarios autenticados pueden actualizar el estado, nivel o limpiezas
CREATE POLICY "Permitir actualización de abrevaderos a usuarios autenticados" 
    ON public.abrevaderos 
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- 5. Política de ELIMINACIÓN: Usuarios autenticados pueden dar de baja abrevaderos
CREATE POLICY "Permitir eliminación de abrevaderos a usuarios autenticados" 
    ON public.abrevaderos 
    FOR DELETE 
    TO authenticated 
    USING (true);

-- =========================================================================================
-- COMENTARIOS TÉCNICOS PARA EL DICCIONARIO DE DATOS
-- =========================================================================================
COMMENT ON TABLE public.abrevaderos IS 'Gestión de puntos de agua para control de reservas durante sequías.';
COMMENT ON COLUMN public.abrevaderos.lote_id IS 'Relación con el potrero/recinto donde está ubicado.';
COMMENT ON COLUMN public.abrevaderos.ultima_limpieza IS 'Fecha de la última desinfección, clave para evitar focos de infección.';
COMMENT ON COLUMN public.abrevaderos.nivel_llenado IS 'Porcentaje actual estimado de agua (0 al 100).';
