"""
=============================================================================
SCRIPT: BUNDLE PROJECT PARA IA (Versión Definitiva)
=============================================================================

MODO DE USO / CÓMO EJECUTARLO:
-----------------------------------------------------------------------------
1. Abre tu terminal (Símbolo del sistema, PowerShell, bash, etc.).
2. Navega hasta la carpeta raíz de tu proyecto (donde está este archivo).
3. Ejecuta el script con el comando básico:

   python bundle_project.py

OPCIONES AVANZADAS (CLI):
-----------------------------------------------------------------------------
Puedes personalizar el comportamiento del script añadiendo "banderas" al final:

- Ver ayuda:
  python bundle_project.py --help

- Cambiar nombre del archivo de salida (por defecto: proyecto_completo.txt):
  python bundle_project.py -o codigo_frontend.txt

- Ignorar archivos de testing (*.spec.ts, *.test.js):
  python bundle_project.py --no-tests

- Ignorar carpetas/archivos extra sin tocar el código:
  python bundle_project.py --ignore assets/ notas_personales.md

- Ejecutar sobre un directorio diferente (por defecto es el actual):
  python bundle_project.py -d ./src/app

Ejemplo combinando varias opciones:
  python bundle_project.py -o volcado.txt --no-tests --ignore docs/

=============================================================================
"""

import os
import argparse
import fnmatch
from pathlib import Path

# ==========================================
# CONFIGURACIÓN POR DEFECTO
# ==========================================
DEFAULT_OUTPUT = "proyecto_completo.txt"

# Carpetas a ignorar siempre (mejora radicalmente el rendimiento)
DEFAULT_EXCLUDE_DIRS = {
    '.git', 'node_modules', '__pycache__', 'venv', 'dist', 
    'build', '.angular', 'www', 'coverage', '.vscode', '.idea'
}

# Extensiones de archivos que no son código o son inútiles para la IA
DEFAULT_EXCLUDE_EXTS = {
    # Multimedia e Imágenes
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.mp3', '.mp4', '.wav',
    # Comprimidos y Documentos Binarios
    '.zip', '.tar', '.gz', '.rar', '.pdf', '.docx', '.xlsx',
    # Compilados y Ejecutables
    '.exe', '.dll', '.so', '.pyc', '.class', '.keystore', '.bin',
    # Archivos de bloqueo de dependencias (generan ruido masivo en la IA)
    '.lock' # ej: package-lock.json, yarn.lock
}

def is_text_file(filepath):
    """Verifica si un archivo es de texto plano intentando leer sus primeros bytes."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            f.read(1024)
        return True
    except (UnicodeDecodeError, Exception):
        return False

def get_gitignore_patterns(root_dir):
    """Detecta y lee automáticamente las reglas de un archivo .gitignore si existe."""
    patterns = []
    gitignore_path = root_dir / '.gitignore'
    if gitignore_path.exists():
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Ignorar comentarios y líneas vacías
                if line and not line.startswith('#'):
                    # Eliminar la barra inicial '/' para alinear con las rutas relativas
                    if line.startswith('/'):
                        line = line[1:]
                    patterns.append(line)
    return patterns

def match_pattern(path_str, patterns):
    """Comprueba si una ruta hace match con algún patrón estilo glob/gitignore."""
    for pat in patterns:
        if fnmatch.fnmatch(path_str, pat) or fnmatch.fnmatch(os.path.basename(path_str), pat):
            return True
        # Cubre los casos de patrones tipo "dist/" (asume carpeta)
        if pat.endswith('/') and fnmatch.fnmatch(path_str + '/', pat):
            return True
    return False

def gather_files(root_path, gitignore_patterns, extra_excludes, ignore_tests):
    """Recorre el proyecto recursivamente y obtiene la lista de archivos que deben incluirse."""
    valid_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_path):
        # ORDENAR ALFABÉTICAMENTE: Garantiza que el árbol y la lectura sean 100% predecibles
        dirnames.sort()
        filenames.sort()
        
        # 1. Filtrar directorios in-place (para que os.walk ni siquiera entre en carpetas ignoradas)
        valid_dirnames = []
        for d in dirnames:
            d_path = Path(dirpath) / d
            rel_d = d_path.relative_to(root_path).as_posix()
            
            if d in DEFAULT_EXCLUDE_DIRS or d in extra_excludes:
                continue
            if match_pattern(rel_d, gitignore_patterns) or match_pattern(d, gitignore_patterns):
                continue
                
            valid_dirnames.append(d)
        dirnames[:] = valid_dirnames
        
        # 2. Filtrar archivos individuales
        for f in filenames:
            f_path = Path(dirpath) / f
            rel_f = f_path.relative_to(root_path).as_posix()
            
            # Evitar el propio archivo de salida
            if f_path.name in extra_excludes or f_path.name == DEFAULT_OUTPUT:
                continue
            if f_path.suffix.lower() in DEFAULT_EXCLUDE_EXTS:
                continue
            if ignore_tests and ('.spec.' in f or '.test.' in f):
                continue
            if match_pattern(rel_f, gitignore_patterns) or match_pattern(f, gitignore_patterns):
                continue
            if not is_text_file(f_path):
                continue
                
            valid_files.append(f_path)
            
    return valid_files

def build_tree_dict(files, root_path):
    """Convierte la lista plana de archivos en un diccionario anidado para pintar el árbol."""
    tree = {}
    for f in files:
        parts = f.relative_to(root_path).parts
        curr = tree
        for part in parts[:-1]:
            if part not in curr:
                curr[part] = {}
            curr = curr[part]
        curr[parts[-1]] = f
    return tree

def format_tree(tree, prefix=''):
    """Genera recursivamente las líneas de texto visuales del árbol de directorios."""
    lines = []
    items = list(tree.items())
    for i, (name, node) in enumerate(items):
        is_last = (i == len(items) - 1)
        connector = '└── ' if is_last else '├── '
        lines.append(f"{prefix}{connector}{name}")
        if isinstance(node, dict):
            extension = '    ' if is_last else '│   '
            lines.extend(format_tree(node, prefix + extension))
    return lines

def main():
    # ==========================================
    # 1. PARSEO DE ARGUMENTOS DE TERMINAL
    # ==========================================
    parser = argparse.ArgumentParser(description="Script definitivo para exportar proyectos completos a TXT para IA.")
    parser.add_argument('--output', '-o', default=DEFAULT_OUTPUT, help=f"Nombre del archivo de salida (por defecto: {DEFAULT_OUTPUT})")
    parser.add_argument('--dir', '-d', default='.', help="Directorio a procesar (por defecto: actual)")
    parser.add_argument('--no-tests', action='store_true', help="Ignorar archivos de tests (*.spec.ts, *.test.js, etc)")
    parser.add_argument('--ignore', nargs='+', default=[], help="Archivos o carpetas extra a ignorar (ej: --ignore docs scripts)")
    
    args = parser.parse_args()
    
    root_path = Path(args.dir).resolve()
    output_path = root_path / args.output
    
    print(f"\n[*] Analizando directorio: {root_path}")
    
    # Obtener reglas de .gitignore
    gitignore_patterns = get_gitignore_patterns(root_path)
    if gitignore_patterns:
        print(f"[*] Se detectó archivo .gitignore. Se aplicarán {len(gitignore_patterns)} reglas de exclusión.")
    
    # ==========================================
    # 2. EXTRACCIÓN Y FILTRADO DE ARCHIVOS
    # ==========================================
    files_to_process = gather_files(root_path, gitignore_patterns, args.ignore, args.no_tests)
    files_to_process = [f for f in files_to_process if f.name != args.output]
    
    if not files_to_process:
        print("[-] No se encontraron archivos válidos para procesar.")
        return
        
    print(f"[*] Procesando {len(files_to_process)} archivos...")
    
    # Contadores para las estadísticas finales
    total_lines = 0
    total_size = 0
    total_chars = 0
    file_contents = []
    
    # ==========================================
    # 3. LECTURA DE ARCHIVOS Y RECOPILACIÓN
    # ==========================================
    for file_path in files_to_process:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Estadísticas
                lines_count = len(content.splitlines())
                size = file_path.stat().st_size
                chars_count = len(content)
                
                total_lines += lines_count
                total_size += size
                total_chars += chars_count
                
                file_contents.append({
                    'path': file_path.relative_to(root_path).as_posix(),
                    'lines': lines_count,
                    'size': size,
                    'content': content
                })
        except Exception as e:
            print(f"[!] Advertencia: Error leyendo {file_path.name}: {e}")
            
    # ==========================================
    # 4. GENERACIÓN DEL ARCHIVO FINAL
    # ==========================================
    print(f"[*] Generando archivo de volcado...")
    with open(output_path, 'w', encoding='utf-8') as outfile:
        # Cabecera principal
        outfile.write("================================================================================\n")
        outfile.write("                     VOLCADO DE PROYECTO PARA IA\n")
        outfile.write("================================================================================\n\n")
        
        # Bloque de Estadísticas e Información Relevante
        outfile.write("### ESTADÍSTICAS DEL PROYECTO\n")
        outfile.write(f"- **Archivos procesados:** {len(files_to_process)}\n")
        outfile.write(f"- **Líneas de código:** {total_lines:,}\n")
        size_mb = total_size / (1024 * 1024)
        outfile.write(f"- **Tamaño total:** {size_mb:.2f} MB\n")
        # Cálculo aproximado estándar para LLMs: 1 Token ≈ 4 caracteres
        estimated_tokens = total_chars // 4
        outfile.write(f"- **Tokens estimados:** ~{estimated_tokens:,} tokens\n\n")
        
        outfile.write("---\n\n")
        
        # Árbol visual de directorios
        outfile.write("### ÁRBOL DE DIRECTORIOS PROCESADOS\n")
        outfile.write("```text\n")
        tree_dict = build_tree_dict(files_to_process, root_path)
        tree_lines = format_tree(tree_dict)
        outfile.write(root_path.name + "/\n")
        for line in tree_lines:
            outfile.write(line + "\n")
        outfile.write("```\n\n")
        
        outfile.write("---\n\n")
        
        # Vaciado del código fuente con resaltado Markdown nativo
        for file_data in file_contents:
            file_path_str = file_data['path']
            # Extraer la extensión sin el punto (.) para usarla en los bloques Markdown
            ext = os.path.splitext(file_path_str)[1]
            md_lang = ext.lstrip('.') if ext else 'text'
            
            # Título del archivo
            outfile.write(f"### ARCHIVO: {file_path_str} ({file_data['lines']} líneas)\n")
            
            # Bloque de código con la sintaxis de su lenguaje
            outfile.write(f"```{md_lang}\n")
            outfile.write(file_data['content'])
            
            # Asegurar un salto de línea antes de cerrar el bloque Markdown si no lo tiene
            if not file_data['content'].endswith('\n'):
                outfile.write("\n")
                
            outfile.write("```\n\n")

    # ==========================================
    # 5. MENSAJES DE ÉXITO EN TERMINAL
    # ==========================================
    print(f"\n[+] ¡Éxito! Volcado generado en: {output_path}")
    print(f"[+] Archivos: {len(files_to_process)} | Líneas: {total_lines:,} | Tokens: ~{estimated_tokens:,} | Tamaño: {size_mb:.2f} MB")

if __name__ == "__main__":
    main()
