# 🐄 Vacapp: Gestión Ganadera Profesional (AgriTech ERP)

[![Angular](https://img.shields.io/badge/Angular-21+-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![Ionic](https://img.shields.io/badge/Ionic-8+-3880FF?style=flat-square&logo=ionic)](https://ionicframework.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**Vacapp** es un sistema ERP (Enterprise Resource Planning) de vanguardia, diseñado específicamente para la gestión profesional, eficiente y basada en datos de explotaciones ganaderas bovinas. Nuestra plataforma facilita un control exhaustivo de todo el ciclo de vida del animal, optimizando la toma de decisiones mediante analítica avanzada y una interfaz de usuario premium.

---

## 🎯 Misión y Visión

Nuestra misión es democratizar el acceso a herramientas tecnológicas de alto nivel para el sector agropecuario, permitiendo a los ganaderos modernizar sus operaciones sin fricciones. Aspiramos a ser el estándar de oro en software de gestión ganadera, combinando una experiencia de usuario excepcional (diseño *Rustic-Luxe*) con una arquitectura técnica robusta y escalable.

---

## ✨ Características Principales

- **📊 Panel de Control Inteligente (Dashboard)**: Visualización panorámica del estado de la explotación con métricas clave, alertas sanitarias tempranas y resúmenes de rendimiento en tiempo real.
- **🐂 Gestión Integral de Ganado**: Registro detallado y trazabilidad de bovinos (identificación electrónica, genealogía profunda, genética) y organización estandarizada por lotes dinámicos.
- **❤️ Control Reproductivo Avanzado**: Seguimiento preciso de celos, cubriciones (monta natural o IA) e inseminaciones. Cálculo predictivo automático de la fecha prevista de parto basado en parámetros zootécnicos.
- **⚖️ Monitorización de Recría y Rendimiento**: Seguimiento del crecimiento con cálculo automático de Ganancia Media Diaria (GMD) y proyecciones de peso al destete/venta.
- **💉 Historial Clínico y Sanidad**: Registro médico inmutable, control de protocolos de vacunación, desparasitaciones y seguimiento de tratamientos específicos por animal, garantizando la seguridad alimentaria.
- **📶 Arquitectura Offline-First**: Operatividad garantizada en zonas de baja cobertura mediante persistencia de datos local avanzada (`localStorage` + `Signal` sync) con sincronización transparente en la nube.

---

## 📚 Índice de Documentación Técnica

Para garantizar una adopción exitosa y facilitar el desarrollo continuo, hemos estructurado una documentación exhaustiva:

1. **[Manual de Usuario](documentation/user_manual.md)**: Guía detallada para el usuario final sobre el uso diario de la plataforma y mejores prácticas.
2. **[Guía de Configuración Backend (Supabase)](documentation/supabase_setup.md)**: Instrucciones para desplegar y conectar la base de datos PostgreSQL y configurar las políticas de seguridad.
3. **[Arquitectura de Software](documentation/architecture.md)**: Detalles sobre los patrones de diseño, gestión de estado con Angular Signals y el ecosistema *Rustic-Luxe*.
4. **[Referencia de la API Interna](documentation/api_reference.md)**: Documentación de los servicios core y modelos de datos principales.
5. **[Estructura del Proyecto](documentation/tree.md)**: Mapa detallado del repositorio y organización del código fuente.
6. **[Guía de Control de Versiones (GitHub)](documentation/github_guide.md)**: Protocolos para contribución, ramas y despliegue continuo.

---

## 🚀 Despliegue Rápido (Quick Start)

### Requisitos del Entorno

- [Node.js](https://nodejs.org/) (v18.x LTS o superior recomendado)
- [Angular CLI](https://angular.dev/tools/cli) (`npm install -g @angular/cli`)

### Instalación Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/vacapp.git
   cd vacapp/frontend
   ```
2. Instalar el árbol de dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo (Hot Module Replacement activado):
   ```bash
   npm start
   ```
4. Acceder al entorno de desarrollo en: [http://localhost:4200](http://localhost:4200)

---

## 🛠️ Stack Tecnológico (Tech Ecosystem)

Vacapp está construido sobre un stack tecnológico moderno y altamente eficiente:
- **Frontend Core**: Angular 17+ (Standalone Components, Signals para reactividad fina).
- **UI/UX Framework**: Ionic Framework 8+ (Componentes nativos, soporte PWA e iOS/Android out-of-the-box).
- **Backend & BaaS**: Supabase (PostgreSQL, Realtime subscriptions, Storage).
- **Estilos**: SASS modular con arquitectura BEM adaptada y tokens de diseño personalizados.

---

## 📄 Licencia y Aspectos Legales

Este proyecto es de uso libre para fines educativos y de gestión ganadera personal bajo la licencia MIT.

---

<p align="center">
  <i>Diseñado y desarrollado con precisión para impulsar el futuro del sector ganadero.</i><br>
  <b>Riverside, CA. 2026.</b>
</p>
