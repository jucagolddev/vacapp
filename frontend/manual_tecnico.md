# 🔧 Manual Técnico: Arquitectura Vacapp Elite

Este documento detalla la infraestructura técnica y lógica de **Vacapp Premium**, su integración con Supabase y el sistema de diseño centralizado.

---

## 🏗️ 1. Arquitectura de la Aplicación

Vacapp está construido sobre un stack moderno de **Angular 18** e **Ionic Framework**, utilizando una arquitectura de componentes *standalone* (sin módulos de clase).

### Directorios Clave:
- **`src/app/core`**: Contiene la lógica transversal: guardias de navegación, modelos de datos (`models/`) y servicios clave (`services/`).
- **`src/app/features`**: Organización modular de funcionalidades (Dashboard, Ganado, Sanidad, etc.).
- **`src/styles/core`**: El corazón visual. Contiene `_luxe.scss`, que define el sistema de diseño "Forest & Earth".

## 🛢️ 2. Persistencia: Supabase & Mock Mode

La aplicación utiliza **Supabase** como base de datos en tiempo real (PostgreSQL). Sin embargo, incluye un motor de simulación inteligente.

### SupabaseService (Administrador de Redundancia):
- **Modo Producción**: Utiliza `@supabase/supabase-js` para interactuar con tablas relacionales.
- **Modo Mock (Desarrollo/Offline)**: Si no hay credenciales, el servicio redirige todas las operaciones CRUD al `LocalStorage` del navegador, simulando incluso los *JOINS* (enriquecimientos de datos).

### Esquema de Datos (Supabase):
```sql
-- Tabla: bovinos
CREATE TABLE bovinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crotal TEXT UNIQUE NOT NULL,
  nombre TEXT,
  sexo TEXT CHECK (sexo IN ('Hembra', 'Macho')),
  raza TEXT,
  fecha_nacimiento DATE,
  estado TEXT DEFAULT 'Activo',
  lote_id UUID REFERENCES lotes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tablas Relacionadas:
-- lotes: Gestión de campo.
-- sanidad: Historial clínico (FK: bovino_id).
-- reproduccion: Ginecología bovina (FK: bovino_id).
-- recria_pesajes: Monitorización de crecimiento (FK: bovino_id).
```

## 🎨 3. Sistema de Diseño "Luxe Forest"

Se ha centralizado la identidad visual en `src/styles/core/_luxe.scss` para evitar duplicidad de CSS. 

### Variables CSS Principales:
- `--ion-color-primary`: #1b4332 (Verde Bosque)
- `--ion-color-secondary`: #582f0e (Marrón Tierra Profundo)
- `--ion-color-tertiary`: #9c6644 (Tierra Clara)
- `--premium-gradient`: Linear-gradient de Verdes Bosque.

## ⚙️ 4. Configuración del Entorno

Para habilitar la sincronización real, edite `environment.ts`:

1. **URL de Supabase**: Localizada en su panel de proyecto en "Settings -> API".
2. **Anon Key**: Clave pública para el acceso de cliente.

### Comandos de Mantenimiento:
```bash
# Compilación de producción optimizada
npm run build --prod

# Auditoría de rendimiento con Lighthouse (local)
npx lighthouse http://localhost:8100 --view
```

---
*Escalabilidad asegurada para el crecimiento de su hato.*
