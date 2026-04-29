# 🏗️ Arquitectura del Sistema: Vacapp

Vacapp está diseñado bajo una arquitectura frontend moderna, robusta y escalable. A continuación, se detallan los pilares técnicos que sostienen la plataforma.

## 1. 📡 Arquitectura Offline-First

El trabajo en el campo a menudo implica conectividad a internet limitada o nula. Vacapp soluciona esto con una estrategia *Offline-First*.

### Mecanismo de Sincronización
- **Lectura**: Cuando la app inicia sin conexión, carga los datos directamente desde el `localStorage` a través del `SupabaseService` (Modo Mock de respaldo).
- **Escritura**: Todas las operaciones CRUD (Crear, Actualizar, Borrar) pasan por el `OfflineSyncService`.
  - Si hay conexión: Se envían directamente a Supabase.
  - Si **no** hay conexión: La operación se encola en una base de datos local (IndexDB o LocalStorage extendido).
- **Reconexión**: Un *Background Worker* monitoriza el estado de la red. Al recuperar la conexión, la cola de operaciones se procesa secuencialmente para sincronizar el estado local con la nube.

> [!TIP]
> Los desarrolladores deben usar siempre `offlineSync.enqueueOperation()` en lugar de llamar directamente a Supabase para garantizar la consistencia en zonas de sombra de cobertura.

---

## 2. ⚡ Gestión de Estado con Angular Signals

Vacapp utiliza **Angular Signals** (`@angular/core`) para una reactividad fina y un rendimiento extremo, dejando atrás la complejidad de RxJS para el estado UI básico.

### Patrón Implementado
- **Signals en Servicios**: Los servicios (ej. `GanadoService`) mantienen el estado maestro en un `signal` privado (`bovinosSignal = signal<Bovino[]>([])`).
- **Exposición de Estado**: El estado se expone a los componentes a través de Signals computadas de solo lectura (`bovinos = computed(() => this.bovinosSignal())`).
- **Efectos (Effects)**: Utilizamos `effect()` para desencadenar recargas automáticas cuando cambia el contexto (por ejemplo, cuando el usuario cambia de "Finca Activa").

Este patrón asegura que Angular solo actualice las partes exactas del DOM que cambian, eliminando la necesidad de `Zone.js` en futuros refactors y logrando una fluidez nativa a 60 FPS.

---

## 3. 🎨 Sistema de Diseño "Rustic-Luxe"

La interfaz de usuario no es genérica. El diseño *Rustic-Luxe* combina la estética tradicional del campo (colores tierra, texturas sutiles) con patrones de UI premium (bordes redondeados, sombras suaves, tipografía *Outfit*).

### Principios de UI
- **Consistencia Modular**: Todos los componentes usan las clases base de `src/styles/components`. Evita usar estilos inline en los componentes HTML.
- **Micro-interacciones**: Transiciones suaves (`0.3s ease-in-out`) en botones y tarjetas para una sensación de aplicación premium.
- **Esqueletos de Carga (Skeleton Text)**: En lugar de un spinner genérico, utilizamos `ion-skeleton-text` para imitar la estructura de la página mientras se cargan los datos, reduciendo la carga cognitiva percibida.

---

## 4. 🧩 Feature-Sliced Design (FSD)

El código está segmentado por "dominio de negocio" en lugar de "tipo de archivo".
En lugar de tener todos los servicios en una carpeta y todos los componentes en otra de forma plana, agrupamos por *Feature*:

```
features/
└── reproduccion/
    ├── reproduccion.component.ts   # Lógica UI
    ├── reproduccion.component.html # Plantilla
    └── reproduccion.component.scss # Estilos locales aislados
```

Esta modularidad estricta asegura que si un módulo (ej. Sanidad) falla o necesita ser reescrito, el resto de la aplicación (ej. Finanzas) permanece completamente inalterado.
