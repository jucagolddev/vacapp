# Estructura del Proyecto Vacapp

A continuación se detalla la organización de archivos y la responsabilidad de cada directorio en la aplicación **Vacapp**.

```text
vacapp/
├── frontend/                 # Aplicación Angular + Ionic
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # Lógica central (Servicios, Modelos, Layouts)
│   │   │   │   ├── layout/   # Estructura visual base (Header, Menu)
│   │   │   │   ├── models/   # Definiciones de datos (Interfaces TypeScript)
│   │   │   │   └── services/ # Conexión a Base de Datos (Supabase/Mock)
│   │   │   ├── features/     # Módulos de funcionalidad (Pantallas)
│   │   │   ├── dashboard/# Panel principal con estadísticas
│   │   │   ├── ganado/   # Gestión de Inventario de Bovinos
│   │   │   ├── lotes/    # Gestión de Lotes y Recintos
│   │   │   ├── recria/   # Control de pesajes y crecimiento
│   │   │   │   ├── reproduccion/ # Gestión de partos y celos
│   │   │   │   └── sanidad/  # Historial médico y tratamientos
│   │   │   ├── app.routes.ts # Configuración de navegación
│   │   │   └── app.config.ts # Configuración global de Angular
│   │   ├── assets/           # Imágenes y recursos estáticos
│   │   ├── environments/     # Configuración de entornos (Supabase Keys)
│   │   └── styles/           # Sistema de diseño (SCSS, Variables, Mixins)
│   ├── angular.json          # Configuración del CLI de Angular
│   └── package.json          # Dependencias y scripts del proyecto
└── README.md                 # Guía principal del repositorio
```

## Descripción de Carpetas Clave

### `core/services/supabase.service.ts`
El corazón de la comunicación de datos. Contiene los métodos para leer, crear, editar y borrar registros. Actualmente incluye un **Modo Mock** con `localStorage` para que la app funcione sin conexión real.

### `core/models/vacapp.models.ts`
Define la forma de los datos (Bovino, Pesaje, Tratamiento, etc.). Asegura que toda la aplicación hable el mismo "idioma" de datos.

## 2. Gestión de Ganado
Es el inventario central de tus animales:
- **Lista de Bovinos**: Muestra todos los animales activos.
- **Registro (Botón +)**: Sigue el asistente de 3 pasos (Identificación, Genealogía, Ubicación) para añadir una vaca o toro.
- **Acciones**: Desliza un animal a la izquierda para **Editar** o **Eliminar**.

## 3. Gestión de Lotes
Controla las ubicaciones de tu explotación:
- Define nombres para tus parcelas o recintos (ej: "Prado Sur", "Corral Central").
- Asigna animales a estos lotes desde el módulo de Ganado.

### `styles/`
Contiene la arquitectura CSS modular. Las variables globales (colores, espaciados) se definen en `abstracts/_variables.scss`.
