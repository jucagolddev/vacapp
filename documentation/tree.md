# 📂 Arquitectura de Directorios: Vacapp

La estructura de archivos de **Vacapp** sigue las mejores prácticas de la comunidad de Angular y principios de diseño modular (Feature-Sliced Design adaptado). Esta organización garantiza que la base de código siga siendo mantenible, escalable y predecible a medida que el proyecto crece.

```text
vacapp/
├── frontend/                 # Aplicación Cliente (Angular 17+ / Ionic 8+)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # 🧠 LÓGICA CENTRAL (Singletones y Configuración)
│   │   │   │   ├── guards/   # Protectores de rutas (Autenticación)
│   │   │   │   ├── layout/   # Envoltorio UI principal (Sidebar, Header, Menú global)
│   │   │   │   ├── models/   # Tipado estricto: Interfaces y Tipos de TypeScript
│   │   │   │   └── services/ # Lógica de negocio, Estado y APIs (Supabase, Sincronización)
│   │   │   │
│   │   │   ├── features/     # 🧩 MÓDULOS DE NEGOCIO (Componentes Aislados)
│   │   │   │   ├── auth/         # Autenticación y Registro
│   │   │   │   ├── dashboard/    # Panel Principal de KPIs
│   │   │   │   ├── manejo/       # Altas, bajas y listado maestro de bovinos
│   │   │   │   ├── lotes/        # Gestión geográfica de fincas y recintos
│   │   │   │   ├── recria/       # Curvas de crecimiento y pesajes
│   │   │   │   ├── reproduccion/ # Algoritmos de gestación y control de partos
│   │   │   │   ├── sanidad/      # Historial clínico y farmacia
│   │   │   │   └── animal-detail/# Intelligence Hub: Vista unificada de un ejemplar
│   │   │   │
│   │   │   ├── shared/       # ♻️ CÓDIGO REUTILIZABLE
│   │   │   │   ├── components/   # Botones, Tarjetas, Modales genéricos
│   │   │   │   └── pipes/        # Formateadores de fechas, monedas, etc.
│   │   │   │
│   │   │   ├── app.component.ts  # Raíz del árbol de componentes
│   │   │   ├── app.config.ts     # Inyección de dependencias globales (Providers)
│   │   │   └── app.routes.ts     # Router global (Lazy Loading de features)
│   │   │
│   │   ├── assets/           # Recursos estáticos (Imágenes, Fuentes, Iconos)
│   │   ├── environments/     # Variables de entorno (Desarrollo vs Producción)
│   │   └── styles/           # 🎨 SISTEMA DE DISEÑO RUSTIC-LUXE (SASS Modular)
│   │       ├── abstracts/    # Variables, Mixins, Funciones (Sin CSS compilado)
│   │       ├── base/         # Resets, Tipografía base
│   │       ├── components/   # Estilos globales de UI (.vac-card, .vac-btn)
│   │       └── layout/       # Sistemas de grillas y contenedores
│   │
│   ├── angular.json          # Configuración maestra del Angular CLI
│   └── package.json          # Registro de dependencias de npm y scripts de construcción
│
└── documentation/            # 📚 Documentación técnica oficial (Markdown)
```

---

## 🏛️ Patrón Arquitectónico: Core vs Features

### El Directorio `core/` (El Motor)
El `core` es el cerebro de la aplicación. Contiene servicios que deben ser instanciados **una sola vez** (Singletons). 
Aquí reside toda la lógica de conexión a la base de datos (`supabase.service.ts`), la lógica de sincronización offline (`offline-sync.service.ts`), y los modelos de datos compartidos que garantizan que el Frontend hable el mismo idioma que el Backend.

### El Directorio `features/` (Los Módulos)
Cada carpeta dentro de `features` representa una pantalla o un flujo de negocio completo. Están diseñadas para ser lo más independientes posible.
Por ejemplo, el módulo de `reproduccion` tiene su propio componente inteligente, su propia plantilla HTML y sus propios estilos SCSS. Esto permite que múltiples desarrolladores trabajen en distintas funcionalidades sin colisionar. El enrutador (`app.routes.ts`) carga estos módulos de forma perezosa (Lazy Loading) para optimizar el rendimiento inicial.

---

## 🎨 Sistema de Diseño (`styles/`)

Hemos implementado una arquitectura de SASS escalable:
- **`_variables.scss`**: Contiene la paleta de colores "Rustic-Luxe" (tonos tierra, verdes oliva, dorados) y las métricas de espaciado.
- **`components/`**: Define clases como `.vac-btn-primary` o `.vac-card-premium` que pueden ser utilizadas en cualquier parte de la aplicación sin necesidad de reescribir CSS.
