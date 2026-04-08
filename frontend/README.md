# 🌲 Vacapp Premium: Forest & Earth Edition

**Vacapp** es una plataforma de gestión ganadera de ultra-lujo, diseñada para explotaciones que buscan la excelencia en el control biométrico, reproductivo y sanitario. Con una estética inspirada en los tonos primarios de la naturaleza (**Bosque Profundo & Tierra Fértil**), Vacapp trasciende la utilidad para convertirse en una experiencia operativa de élite.

![Dashboard Preview](https://supabase.com/dashboard/static/img/supabase-logo.svg) <!-- Reemplazar con captura real si es posible -->

## ✨ Filosofía de Diseño: "Luxe Forest"

La interfaz ha sido meticulosamente calibrada para evocar la serenidad y la robustez del campo:
- **Bosque Secreto (#1b4332)**: Utilizado para la jerarquía primaria y la autoridad institucional.
- **Tierra Fértil (#582f0e)**: Acentúa la conexión sensorial con el terreno y la herencia ganadera.
- **Vidrio Esmerilado (Glassmorphism)**: Paneles translúcidos que aportan ligereza y sofisticación moderna.

## 🚀 Módulos de Élite

### 📊 Cuadro de Mando (Dashboard)
Analítica en tiempo real del inventario. Visualización inmediata de indicadores clave (KPIs) mediante tarjetas de rendimiento de alta fidelidad.

### 🐄 Gestión de Hato (Ganado)
Registro biométrico individualizado. Incluye un asistente (Wizard) de tres pasos para una trazabilidad perfecta: Biometría, Linaje y Ubicación.

### 🗺️ Gestión de Campo (Lotes)
Control geográfico de recintos y parcelas. Organiza el pastoreo mediante una arquitectura de tarjetas de terreno intuitiva.

### 🏥 Sanidad & Clínica
Historial médico digital completo. Control de vacunaciones, desparasitaciones y protocolos veterinarios con firma de registro.

### 🧬 Reproducción & Linaje
Seguimiento del ciclo de vida. Cálculo automático de fechas de parto y monitorización de gestaciones críticas con alertas visuales (Latido de Vida).

### ⚖️ Recría & Rendimiento
Monitoreo de GMD (Ganancia Media Diaria) mediante pesajes periódicos asistidos. Análisis visual de tendencias de crecimiento.

## 🛠️ Ecosistema Técnico

- **Frontend**: Angular 18 + Ionic Framework (Standalone Components).
- **Estilos**: Sistema de diseño centralizado en SCSS (`_luxe.scss`).
- **Backend (Persistencia)**: Supabase (PostgreSQL + Auth + Real-time).
- **Modo Offline/Mock**: Sistema inteligente de redundancia mediante LocalStorage para operaciones sin conexión.

## 📦 Instalación

```bash
# Clonar el ecosistema
git clone https://github.com/usuario/vacapp-premium.git

# Instalar dependencias de élite
npm install

# Iniciar servidor de desarrollo
npm run start
```

## 🔐 Configuración de Supabase

Para pasar del modo **Mock** a producción, actualiza `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'TU_URL_DE_SUPABASE',
  supabaseKey: 'TU_API_KEY_ANON'
};
```

---
*Desarrollado para la ganadería del mañana, hoy.*
