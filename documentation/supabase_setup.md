# Guía Técnica: Conexión Real a Supabase

Actualmente, **Vacapp** funciona en **Modo Mock (Simulación)** utilizando `localStorage`. Esto es ideal para demostraciones sin configurar una base de datos. Para usar la aplicación de forma profesional, sigue estos pasos.

## 1. Configuración de Credenciales
Abre el archivo `src/environments/environment.ts` y completa los campos:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'TU_ANON_KEY_DE_SUPABASE'
};
```

## 2. Estructura de la Base de Datos (Tablas)
Asegúrate de que tu proyecto en Supabase tenga las siguientes tablas:

- **bovinos**: `id`, `crotal`, `nombre`, `sexo`, `raza`, `estado`, `lote_id`, `madre_id`, `padre_id`.
- **lotes**: `id`, `nombre`, `ubicacion`.
- **reproduccion**: `id`, `bovino_id`, `fecha_celo`, `fecha_cubricion`, `tipo_cubricion`, `estado_gestacion`, `fecha_parto_prevista`.
- **sanidad**: `id`, `bovino_id`, `fecha`, `tipo`, `producto`, `observaciones`.
- **recria_pesajes**: `id`, `bovino_id`, `fecha_pesaje`, `peso_kg`, `tipo_pesaje`.

> [!IMPORTANT]
> Puedes encontrar el esquema SQL detallado para crear estas tablas en el archivo `documentation/schema.sql` (si está disponible) o consultando los modelos en `vacapp.models.ts`.

## 3. Desactivación Automática del Modo Mock
Una vez que introduzcas las llaves en `environment.ts`, el servicio `SupabaseService` detectará su presencia y cambiará automáticamente de `localStorage` a la API real de Supabase.

---

## Prompt Maestro para Reconectar (Uso con IA)
Si en el futuro deseas que una Inteligencia Artificial (como Antigravity) realice la reconexión por ti, copia y pega el siguiente mensaje:

> **PROMPT MAESTRO PARA RECONEXIÓN:**
> "Actualmente la aplicación 'Vacapp' está en Modo Mock utilizando localStorage. Necesito que la conectes a mi base de datos real de Supabase. Mis credenciales son: URL **[ESCRIBE_AQUÍ_TU_URL]** y KEY **[ESCRIBE_AQUÍ_TU_KEY]**. Por favor:
> 1. Actualiza `src/environments/environment.ts` con estas llaves.
> 2. Asegúrate de que `SupabaseService` desactive el Modo Mock y empiece a usar el cliente nativo de Supabase para todas las operaciones CRUD.
> 3. Verifica que las tablas en Supabase coincidan con los modelos definidos en `vacapp.models.ts`."

---
*Fin del documento de configuración.*
 Riverside, CA. 2026.
