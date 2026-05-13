# 🐮 Vacapp: Gestión Inteligente

**Vacapp** es el compañero digital que todo ganadero necesita. Una herramienta robusta y de **alta densidad de información** diseñada específicamente para optimizar la gestión de tu explotación ganadera. Funciona rápido, sin interrupciones, y se adapta tanto al trabajo duro en el campo como a la gestión detallada desde tu oficina.

---

## 🌟 Optimizada para el Campo y la Oficina

Vacapp no es una app convencional. Su interfaz está diseñada bajo el sistema *Rustic-Luxe*, garantizando máxima legibilidad bajo la luz del sol (con un excelente contraste) y mostrando toda la información de manera compacta para que puedas consultar decenas de animales en un solo vistazo desde cualquier pantalla.

### 📱 Funciona en el Campo (PWA)
Sabemos que en las zonas de pastoreo la cobertura es intermitente o nula. Vacapp guarda todos tus registros (partos, ventas, vacunas, pesajes) directamente en la memoria de tu teléfono. Al recuperar la señal, sincronizará todo de manera automática y 100% segura.

### 🔍 Escaneo de Códigos QR
Identifica a tus animales en un segundo. 
- Cada res tiene un código QR único asignado.
- Escanea con la cámara del móvil y accede a su ficha técnica completa al instante.

### 📊 Control de Pesos y Sanidad
No pierdas dinero con animales que no ganan peso o enferman. 
- Registra pesajes y comprueba las gráficas evolutivas en el momento.
- Controla tratamientos veterinarios, vacunas y días de retiro.
- Visualiza el impacto económico y de salud de forma precisa.

### 📸 Registro Fotográfico y Trazabilidad
El "Libro de Explotación" evoluciona. Adjunta fotos reales para evitar errores de identificación y mantén documentado el progreso de tus lotes y crías con total fidelidad.

### 💰 Gestión Financiera "Cuentas Claras"
El control que necesitas en la oficina. Anota compras de alimento, gastos veterinarios y facturación por ventas. Analiza tu rentabilidad general por periodos y optimiza tus inversiones.

---

## 📲 Guía de Instalación Rápida

No busques en la App Store o Google Play. Vacapp se instala directamente desde tu navegador web como una **Aplicación Web Progresiva (PWA)** en menos de 10 segundos:

1. **Abre el enlace** de Vacapp en Chrome (Android) o Safari (iPhone).
2. Pulsa el botón de **"Opciones"** (los tres puntos en Android o el botón de compartir ⬆️ en iPhone).
3. Selecciona la opción **"Añadir a la pantalla de inicio"**.
4. Pulsa **"Añadir"**.

¡Listo! Disfruta de la experiencia nativa de Vacapp con un solo toque desde tu escritorio, estés donde estés.

---
*Vacapp: Tecnología de élite, diseñada por y para la gente del campo.*

## 🛠️ Guía de Inicio para Desarrolladores

Si vas a trabajar en el código de Vacapp, sigue estos pasos para levantar el entorno local:

1. **Requisitos**: Node.js (v20 o v22 LTS recomendados) y npm.
2. **Instalación**:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```
3. **Ejecución**:
   ```bash
   npm start
   ```
4. **Acceso**: Abre [http://localhost:4200](http://localhost:4200) en tu navegador.

> [!WARNING]
> **¿Problemas al arrancar? (Se queda en "Building...")**
> Si tu proceso de compilación se queda bloqueado o experimentas errores, es probable que se deba a una versión inestable de Node.js (ej. v25.x). 
> Lee la **[Guía de Arranque y Resolución de Problemas](GUIA_ARRANQUE.md)** para encontrar la solución inmediata y una alternativa rápida.

*Nota: La aplicación utiliza **Modo Mock** por defecto. No necesitas configurar Supabase para las pruebas iniciales.*

