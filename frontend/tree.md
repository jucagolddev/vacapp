# 🌳 Estructura de Directorios: Vacapp Premium

A continuación se detalla la organización jerárquica del ecosistema de **Vacapp Elite**.

---

```text
vacapp/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                  # Lógica Transversal
│   │   │   │   ├── models/            # Interfaces: Bovino, Lote, Pesaje...
│   │   │   │   └── services/          # Conectividad Supabase & Mock
│   │   │   ├── features/              # Módulos de Funcionalidad (Standalone)
│   │   │   │   ├── dashboard/         # Estadísticas & KPIs
│   │   │   │   ├── ganado/            # Registro & Inventario
│   │   │   │   ├── lotes/             # Gestión de Campo
│   │   │   │   ├── sanidad/           # Historial Clínico
│   │   │   │   ├── reproduccion/      # Ginecología & Partos
│   │   │   │   └── recria/            # Pesaje & Rendimiento
│   │   │   └── shared/                # Componentes Reutilizables
│   │   ├── assets/                    # Iconografía & Multimedia
│   │   ├── styles/                    # Sistema de Diseño de Lujo
│   │   │   ├── core/                  # _luxe.scss (Bosque & Tierra)
│   │   │   └── main.scss              # Punto de entrada de estilos
│   │   ├── theme/                     # Variables Ionic nativas
│   │   └── environments/              # Credenciales Supabase
│   ├── README.md                      # Presentación de Élite
│   ├── manual_usuario.md              # Guía para el Ganadero
│   └── manual_tecnico.md              # Guía para el Desarrollador
└── backend/                           # Reserva para futuras APIs
```

### Notas sobre la Organización:
- **Clean Architecture**: Los servicios están desacoplados de la UI para permitir el intercambio de Supabase por cualquier otra DB sin afectar las vistas.
- **Micro-Styling**: Cada componente importa solo lo esencial, delegando la identidad visual al núcleo de estilos `_luxe.scss`.
- **Standalone**: Eliminación de módulos pesados en favor de componentes atómicos y eficientes.

---
*Diseño y Orden: El éxito de la gestión comienza en el código.*
