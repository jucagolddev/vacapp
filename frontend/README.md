# 🐮 Vacapp: Tu ganadería siempre contigo

**Vacapp** es la solución tecnológica definitiva para el ganadero moderno. Diseñada para soportar las condiciones más exigentes del campo, nuestra aplicación te permite gestionar tu explotación con precisión quirúrgica, eliminando el papeleo y optimizando cada euro invertido.

---

## 🚀 ¿Por qué elegir Vacapp?

### 📊 Gráficas de crecimiento y rendimiento
No trabajes a ciegas. Visualiza la evolución del peso de tus animales con gráficas interactivas. Detecta patrones de crecimiento y toma decisiones basadas en datos reales para maximizar la rentabilidad de tu hato.

### 🏥 Control sanitario sin papeles
Lleva el historial clínico completo de cada ejemplar en tu bolsillo. Registra vacunaciones, tratamientos y periodos de retiro de forma sencilla. El sistema te alertará automáticamente si un animal está en periodo de retiro de leche o carne.

### 📱 Modo "Monte" (Offline-First)
La falta de cobertura ya no es un problema. Registra nacimientos, pesajes o movimientos en lo más alto del puerto; Vacapp guardará los datos y los sincronizará automáticamente cuando vuelvas a tener conexión.

### 🔍 Identificación Inteligente
Escanea el crotal o el código QR del animal para acceder instantáneamente a su ficha completa: genealogía, estado reproductivo y alertas de salud.

---

## 📲 Guía de Instalación en el Móvil (PWA)

Vacapp es una **Aplicación Web Progresiva (PWA)**, lo que significa que no ocupa espacio innecesario y se actualiza sola.

### En Android (Chrome):
1. Visita la URL de la aplicación.
2. Pulsa los **tres puntos** (⋮) de la esquina superior derecha.
3. Selecciona **"Instalar aplicación"** o **"Añadir a pantalla de inicio"**.

### En iPhone (Safari):
1. Visita la URL de la aplicación.
2. Pulsa el botón de **"Compartir"** (el cuadrado con la flecha hacia arriba ⬆️).
3. Desliza hacia abajo y pulsa **"Añadir a pantalla de inicio"**.

---

## 🛠️ Sección Técnica (Para Desarrolladores)

Este proyecto ha sido construido utilizando tecnologías de vanguardia para asegurar su escalabilidad y robustez.

### Stack Tecnológico:
*   **Frontend**: Angular 18 (Standalone Components) + Ionic 8.
*   **Backend / DB**: Supabase (PostgreSQL + Realtime).
*   **Offline**: Service Workers + LocalForage (IndexedDB).
*   **Gráficos**: Chart.js / ng2-charts.

### Cómo levantar el proyecto:

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repo>
   cd vacapp/frontend
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   ionic serve
   ```
   *Nota: La aplicación se abrirá automáticamente en `http://localhost:4200`.*

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

---
*Desarrollado con ❤️ para el sector agropecuario por el equipo de Vacapp AgriTech.*
