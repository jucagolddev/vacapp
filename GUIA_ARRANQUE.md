# 🚀 Guía de Arranque de Vacapp (Resolución de Problemas)

Si estás experimentando problemas al intentar arrancar el servidor de desarrollo de Vacapp (por ejemplo, el proceso se queda atascado en `> Building...`), sigue esta guía para solucionarlo.

## ⚠️ El Problema: Versión de Node.js Incompatible

Actualmente, el entorno está ejecutando **Node.js v25.2.1** (una versión en desarrollo / no-LTS). Angular CLI y su sistema de compilación subyacente (`esbuild`) pueden presentar bloqueos silenciosos o errores al compilar con versiones inestables de Node.js.

## 🛠️ Solución Recomendada: Cambiar la versión de Node.js

Para el desarrollo diario con Angular, **siempre se recomienda usar una versión LTS (Long Term Support)**.

1. Instala una versión estable de Node.js (como la **v22 LTS** o **v20 LTS**). Puedes usar herramientas como `nvm` (Node Version Manager) para Windows.
2. Una vez cambiada la versión, elimina la carpeta de dependencias y reinstala para evitar cachés corruptas:
   ```bash
   cd frontend
   rmdir /s /q node_modules
   rmdir /s /q .angular
   npm install --legacy-peer-deps
   ```
3. Inicia el proyecto normalmente:
   ```bash
   npm start
   ```

## ⚡ Solución Alternativa: Ejecutar la versión pre-compilada

Si necesitas ver el proyecto **ahora mismo** sin cambiar tu versión de Node.js, puedes servir los archivos que ya fueron compilados previamente en la carpeta `dist`.

1. Abre una terminal en la carpeta `frontend`.
2. Ejecuta un servidor estático (como `http-server`) apuntando a la carpeta de producción:
   ```bash
   npx http-server ./dist/vacapp/browser -p 4200 -c-1
   ```
3. Abre tu navegador y navega a [http://localhost:4200](http://localhost:4200).

---
*Nota: Si estás usando PowerShell y obtienes errores de `Execution_Policies`, utiliza `npm.cmd` o `npx.cmd` en lugar de `npm` o `npx`.*
