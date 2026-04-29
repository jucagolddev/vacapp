# 🔌 Referencia de la API Interna (Core Services)

Esta referencia documenta los servicios inyectables principales en la carpeta `src/app/core/services/` que exponen la lógica de negocio a los componentes de presentación.

---

## 1. `SupabaseService`
**Ruta:** `core/services/supabase.service.ts`
**Propósito:** Capa de abstracción de bajo nivel para la persistencia de datos. Maneja el cliente Supabase nativo y el fallback a LocalStorage (Modo Mock).

### Métodos Principales:
- `getAll<T>(table: string)`: Promesa. Devuelve todos los registros de una tabla, enriquecidos (JOIN simulado) si está en Modo Mock.
- `create<T>(table: string, payload: Partial<T>)`: Inserta un registro. Inyecta UUIDs automáticamente en Modo Mock.
- `update<T>(table: string, id: string, payload: Partial<T>)`: Modifica un registro existente.
- `delete(table: string, id: string)`: Elimina un registro por ID.
- `getAnimalCompleteData(id: string)`: Realiza peticiones paralelas (o agregación Mock) para devolver TODO el perfil 360 de un animal (bovino, sanidad, pesajes, reproduccion, finanzas).

---

## 2. `OfflineSyncService`
**Ruta:** `core/services/offline-sync.service.ts`
**Propósito:** Garantizar que los datos no se pierdan si el usuario realiza cambios sin conexión.

### Métodos Principales:
- `isOnline()`: Devuelve un `boolean` reactivo sobre el estado de la red.
- `enqueueOperation(table, action, payload, id?)`: Pone en cola una mutación para ser procesada más tarde.
- `processQueue()`: Intenta ejecutar todas las operaciones pendientes contra Supabase. Se llama automáticamente al recuperar la conexión.

---

## 3. `GanadoService`
**Ruta:** `core/services/ganado.service.ts`
**Propósito:** Lógica de negocio específica para el inventario de bovinos.

### Signals Expuestos:
- `bovinos()`: Lista reactiva de todos los bovinos de la finca activa.
- `isLoading()`: Estado de carga.
- `distCategoria()`: Devuelve un mapa con la cantidad de animales por categoría zootécnica (Vaca, Ternero, Novilla, etc.).

### Lógica Calculada (Métodos Puros):
- `calculateCategoria(bovino: Bovino)`: Retorna la categoría basada en sexo y fecha de nacimiento.
- `getEdadDesc(bovino: Bovino)`: Retorna un string legible (ej. "3 años", "8 meses").
- `getUgb(bovino: Bovino)`: Calcula la Unidad de Ganado Mayor para análisis de carga forrajera.

---

## 4. Servicios Específicos de Módulo
Cada módulo tiene su propio servicio que actúa como un repositorio tipado sobre el `SupabaseService`.

- **`PesajeService`**: `getPesajes()`, `createPesaje()`, `getEvolucionPrincipales()` (Prepara datos para Chart.js).
- **`SanidadService`**: `getSanidad()`, `createSanidad()`, etc.
- **`ReproduccionService`**: Maneja la lógica de validación de fechas de celo y cálculos de días de gestación previstos.

---

## 5. Modelos de Datos (`vacapp.models.ts`)
Todas las transferencias de datos deben adherirse a las interfaces de TypeScript.

Ejemplo de `Bovino`:
```typescript
export interface Bovino {
  id: string;
  crotal: string;
  nombre?: string;
  sexo: 'Macho' | 'Hembra';
  raza: string;
  porcentaje_pureza?: number;
  finca_id: string;
  lote_id?: string;
  estado_productivo: 'Alta' | 'Baja' | 'Vendido' | 'Muerto';
  estado_reproductivo?: 'Vacía' | 'Gestante' | 'Lactante' | 'Seca' | 'Semental' | 'Engorde';
  fecha_nacimiento?: string;
  aptitud?: 'Carne' | 'Leche' | 'Doble Propósito';
  // ...
}
```
