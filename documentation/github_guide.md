# Guía de Publicación en GitHub: Vacapp

Sigue estos pasos para subir tu proyecto a un repositorio de GitHub de forma profesional.

## 1. Prepación (Pre-vuelo)
Asegúrate de que estás en la raíz del proyecto (`vacapp/`).

### Verifica el archivo `.gitignore`
Es **CRUCIAL** que no subas tus llaves de Supabase ni las carpetas de dependencias. Revisa que tu `.gitignore` incluya:
```text
node_modules/
.angular/
dist/
src/environments/environment.ts
```
> [!WARNING]
> Nunca subas el archivo `environment.ts` si contiene tus llaves reales. En GitHub se suele subir un `environment.prod.ts.example` sin las llaves.

## 2. Comandos de Git (Paso a Paso)

### Inicializa el repositorio local
Si aún no has inicializado git:
```powershell
git init
```

### Añade los archivos al área de preparación
```powershell
git add .
```

### Primer Commit (Guardado)
```powershell
git commit -m "feat: Versión inicial estable de Vacapp con Modo Mock funcional"
```

### Conecta con GitHub
1. Crea un nuevo repositorio en [github.com](https://github.com/new).
2. Copia la URL del repositorio.
3. Ejecuta en tu terminal:
```powershell
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

## 3. Mejores Prácticas para GitHub
- **Ramas (Branches)**: No trabajes siempre en `main`. Crea ramas para nuevas funciones (`git checkout -b feat/nueva-funcion`).
- **README**: Mantén el README actualizado con instrucciones de instalación claras.
- **Commits**: Escribe mensajes descriptivos (ej: "fix: Corregido error en cálculo de partos").

---

Para volver a conectar la base de datos real en el futuro, consulta el archivo `documentation/supabase_setup.md`.
 Riverside, CA. 2026.
