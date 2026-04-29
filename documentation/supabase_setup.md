# ☁️ Guía Técnica: Conexión Backend con Supabase

Actualmente, **Vacapp** opera de forma predeterminada en **Modo Mock (Simulación Offline)**, utilizando `localStorage` para la persistencia de datos. Esta configuración es ideal para demostraciones, desarrollo inicial o uso en áreas sin cobertura. 

Sin embargo, para un despliegue de grado de producción, es imperativo conectar la aplicación a un backend real (PostgreSQL). Supabase es la solución BaaS (Backend as a Service) recomendada para este proyecto.

---

## 1. 🔑 Configuración de Credenciales de Entorno

Para habilitar la conexión con la nube, debes inyectar tus credenciales en el archivo de entorno de Angular.

Abre el archivo `src/environments/environment.ts` (y `environment.development.ts`) y completa los campos correspondientes:

```typescript
export const environment = {
  production: false, // Cambiar a true en environment.ts para despliegue
  useMockData: false, // Asegúrate de que esto sea false o no esté definido
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'TU_ANON_KEY_DE_SUPABASE'
};
```

> [!WARNING]
> **Seguridad**: Nunca expongas tu `service_role_key` en el frontend. Utiliza siempre la `anon_key` pública. La seguridad de los datos debe garantizarse mediante Row Level Security (RLS) en la base de datos, no ocultando la clave pública.

---

## 2. 🗄️ Esquema de Base de Datos Relacional

Tu proyecto en Supabase debe reflejar la siguiente estructura relacional. Puedes utilizar la interfaz de Supabase o ejecutar scripts SQL.

Tablas requeridas:
- **`bovinos`**: `id` (UUID), `crotal`, `nombre`, `sexo`, `raza`, `estado_productivo`, `lote_id` (FK), `finca_id` (FK).
- **`lotes`**: `id` (UUID), `nombre`, `ubicacion`, `finca_id` (FK).
- **`reproduccion`**: `id` (UUID), `bovino_id` (FK), `fecha_celo`, `fecha_cubricion`, `tipo_cubricion`, `estado_gestacion`, `fecha_parto_prevista`.
- **`sanidad`**: `id` (UUID), `bovino_id` (FK), `fecha`, `tipo`, `producto`, `observaciones`.
- **`recria_pesajes`**: `id` (UUID), `bovino_id` (FK), `fecha_pesaje`, `peso_kg`, `tipo_pesaje`.

> [!NOTE]
> Puedes encontrar una representación exacta de estos modelos en el archivo TypeScript `src/app/core/models/vacapp.models.ts`.

---

## 3. 🛡️ Políticas de Seguridad (Row Level Security - RLS)

Para despliegues de producción, es **obligatorio** habilitar RLS en todas tus tablas. Esto garantiza que un usuario (ganadero) solo pueda acceder a los datos de su propia finca.

Recomendación de política básica (ejemplo para la tabla `bovinos`):

```sql
-- Habilitar RLS
ALTER TABLE public.bovinos ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Solo el propietario de la finca puede leer
CREATE POLICY "Lectura de bovinos propios" ON public.bovinos
FOR SELECT USING (
  auth.uid() IN (
    SELECT owner_id FROM public.fincas WHERE id = bovinos.finca_id
  )
);
```

---

## 4. 🔄 Transición Automática (Del Mock a Producción)

La arquitectura de Vacapp es inteligente. Una vez que detecta credenciales válidas en `environment.ts` y si `useMockData` no está forzado a `true`, el servicio central (`SupabaseService`) desactivará automáticamente el almacenamiento local y comenzará a enrutar todas las peticiones CRUD directamente a la API REST de Supabase mediante suscripciones en tiempo real.

---

## 🤖 Prompt Maestro para Reconexión Asistida por IA

Si estás utilizando un asistente de IA (como Antigravity) para mantener tu código, puedes utilizar el siguiente *prompt* estandarizado para delegar la configuración:

> **PROMPT DE CONFIGURACIÓN BACKEND:**
> "La aplicación 'Vacapp' está actualmente en Modo Mock. Necesito migrar a producción conectándola a mi instancia de Supabase. 
> Mis credenciales son: URL **[ESCRIBE_AQUÍ_TU_URL]** y KEY **[ESCRIBE_AQUÍ_TU_KEY]**.
> Por favor, ejecuta las siguientes tareas:
> 1. Inyecta estas credenciales en los archivos `environment.ts` pertinentes.
> 2. Revisa `SupabaseService` para asegurar que el Modo Mock se desactive limpiamente.
> 3. Verifica que las interfaces en `vacapp.models.ts` estén perfectamente alineadas con un esquema PostgreSQL estándar."
