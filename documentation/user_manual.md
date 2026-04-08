# Manual de Uso: Vacapp

Guía detallada para el usuario final sobre cómo gestionar su explotación ganadera con **Vacapp**.

## 1. Panel de Control (Dashboard)
Al entrar, verás un resumen de tu explotación:
- **Bovinos Registrados**: Cantidad total de cabezas.
- **Lotes en Campo**: Cuántas divisiones de pasto tienes.
- **Alertas**: Notificaciones urgentes de sanidad o partos próximos.

## 2. Gestión de Ganado (Módulo de Manejo)
Aquí es donde registras tus animales:
- **Pestaña Bovinos**: Muestra la lista de animales. Usa el **botón flotante (+)** para añadir uno nuevo.
  - Sigue el asistente de 3 pasos: Identificación, Genealogía y Ubicación.
- **Pestaña Lotes**: Crea divisiones para tu campo (ej: "Zerrado Sur", "Prado de las Vigas").
- **Acciones**: Desliza un animal o lote hacia la izquierda para ver opciones de **Editar** o **Eliminar**.

## 3. Salud Animal (Módulo de Sanidad)
Registra vacunas, desparasitaciones o tratamientos por enfermedad:
- Visualiza el historial completo en formato tabla.
- Filtra rápidamente por **Crotal** para ver el historial de una vaca específica.
- Usa el **botón (+)** para registrar un nuevo tratamiento médico.

## 4. Reproducción (Celos y Partos)
Controla el ciclo reproductivo de tus hembras:
- **Gestaciones en Curso**: Tarjetas que muestran cuántos días faltan para el parto (basado en una gestación de 283 días).
- **Cálculo Automático**: Al introducir la fecha de cubrición, el sistema calcula automáticamente la **fecha de parto prevista**.
- Mantén un historial de celos, inseminaciones y confirmaciones de preñez.

## 5. Crecimiento (Módulo de Recría)
Seguimiento del peso de los animales:
- Registra pesajes en diferentes etapas (Nacimiento, Destete, Recría).
- **Ganancia de Peso**: El sistema calcula automáticamente la diferencia respecto al último pesaje del mismo animal y la muestra en verde (si aumenta) o rojo.

## 6. Eliminación de Registros
En todos los módulos puedes eliminar información que ya no sea necesaria:
- **Bovinos y Lotes**: Desliza el elemento hacia la izquierda para ver el botón rojo de basura.
- **Sanidad, Reproducción y Recría**: Usa el icono de la papelera (**trash**) directamente en la tarjeta o lista de registros.
- **Confirmación**: Siempre se te pedirá confirmar antes de borrar definitivamente.

---

### Nota sobre el Almacenamiento
Si no has configurado las llaves de Supabase (Modo Demo), todos los datos se guardan en la memoria de tu navegador (**localStorage**). Esto significa que si borras los datos del sitio, los registros se perderán. Para un uso profesional, configura la base de datos real.
