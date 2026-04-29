# 📖 Manual del Usuario: Vacapp AgriTech ERP

Bienvenido a la guía de operaciones oficial de **Vacapp**, el sistema integral para la gestión ganadera moderna. Esta guía está diseñada para que operarios, mayorales y gerentes maximicen el potencial de la plataforma.

---

## 1. 📊 Inteligencia de Negocio (Dashboard)

El Centro de Mando proporciona una vista de águila sobre toda tu operación. Los indicadores clave de rendimiento (KPIs) se actualizan en tiempo real.

- **Censo Total**: Volumen actualizado del inventario activo.
- **Distribución de Lotes**: Ocupación actual de parcelas y potreros.
- **Alertas Críticas**: Notificaciones proactivas de sanidad, próximos partos y eventos urgentes.

> [!TIP]
> **Pro Tip**: Revisa el Dashboard cada mañana para planificar las tareas del día basándote en las alertas prioritarias de salud y reproducción.

---

## 2. 🐂 Gestión de Inventario (Módulo de Manejo)

El núcleo de la trazabilidad. Mantén registros impecables de cada ejemplar.

- **Alta de Ejemplares**: Utiliza el botón flotante **(+)** para invocar el asistente de creación.
  - *Identificación*: Crotal oficial, nombre de manejo, raza y pureza.
  - *Genealogía*: Registro de ascendencia (Padre/Madre) para evitar consanguinidad.
  - *Ubicación*: Asignación inmediata a un lote operativo.
- **Lotes y Parcelas**: Gestiona la rotación de pastos asignando nombres claros a tus recintos (ej. "Cuartel Norte", "Maternidad").

> [!IMPORTANT]
> **Mejores Prácticas**: Asegúrate de que el "Crotal" coincida exactamente con la identificación oficial del animal para evitar discrepancias en auditorías e inspecciones gubernamentales.

---

## 3. 💉 Control Sanitario (Módulo de Sanidad)

Un registro médico inmutable es vital para la seguridad alimentaria y la certificación de la explotación.

- **Historial Clínico**: Visualización tabular de todas las intervenciones médicas.
- **Búsqueda Rápida**: Filtra instantáneamente por crotal para analizar el historial de un ejemplar específico antes de administrar nuevos tratamientos.
- **Registro de Intervenciones**: Añade vacunas, desparasitaciones, curas y pruebas diagnósticas con sus respectivos costes y tiempos de retiro (carencia).

> [!CAUTION]
> **Tiempos de Retiro**: Registra siempre los días de retiro de carne o leche tras aplicar antibióticos para garantizar que tu producto sea apto para consumo humano.

---

## 4. ❤️ Control Reproductivo

Maximiza la eficiencia reproductiva reduciendo los días abiertos.

- **Monitoreo de Gestaciones**: El sistema calcula automáticamente la fecha probable de parto basándose en una gestación estándar de 283 días.
- **Tipos de Cubrición**: Registra Monta Natural (asociando el Semental) o Inseminación Artificial (IA).
- **Flujo de Trabajo**: Registra el Celo -> Inseminación -> Confirmación de Preñez -> Parto.

> [!NOTE]
> Las tarjetas de gestación cambiarán de color a medida que se acerque la fecha de parto, proporcionando una alerta visual inconfundible.

---

## 5. ⚖️ Rendimiento y Recría

Convierte el crecimiento en datos analíticos.

- **Registro de Pesajes**: Introduce el peso en hitos clave (Nacimiento, Destete, Transición, Finalización).
- **Ganancia Media Diaria (GMD)**: El motor analítico calcula automáticamente el incremento o pérdida de peso respecto al control anterior.

> [!TIP]
> **Pro Tip**: Establece pesajes regulares (mensuales o trimestrales). Un indicador en rojo (pérdida de peso) puede ser el primer síntoma clínico de una patología subclínica o de deficiencia nutricional en un lote.

---

## 6. 🗑️ Mantenimiento de Registros

Mantén tu base de datos limpia y actualizada.

- **Bajas y Descartes**: Desliza un animal hacia la izquierda (swipe left) en la lista para acceder a las acciones de edición o purga.
- **Confirmación de Seguridad**: El sistema siempre requerirá una confirmación explícita antes de eliminar definitivamente cualquier registro para prevenir pérdidas accidentales de datos.

---

### 📡 Sincronización y Modo de Conexión

Vacapp utiliza una arquitectura *Offline-First*.
Si experimentas pérdida de señal en el campo, continúa trabajando con normalidad. Tus registros se guardarán en el almacenamiento local seguro (`localStorage`) del dispositivo y se sincronizarán automáticamente con la nube principal cuando recuperes la conexión a internet.

> [!WARNING]
> Si operas exclusivamente en el "Modo Demo" (sin conexión a base de datos configurada), borrar el caché de tu navegador resultará en la pérdida total de la información. Consulte a su administrador de sistemas para configurar la base de datos de producción.
