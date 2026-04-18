# MODO DE USO MANUAL EN TERMINAL:
# 1. Abre la terminal o PowerShell
# 2. Asegúrate de estar en la carpeta raíz (c:\xampp\htdocs\vacapp)
# 3. Ejecuta el comando: python bundle_project.py

import os

# Configuración
OUTPUT_FILE = "proyecto_completo.txt"

# 1. Ampliamos las carpetas a ignorar (muy importante para Angular/Ionic)
EXCLUDE_DIRS = {
    '.git', 'node_modules', '__pycache__', 'venv', 'dist', 
    'build', '.angular', 'www', 'coverage', '.vscode'
}

# 2. Lista de extensiones de archivos binarios a ignorar
EXCLUDE_EXTENSIONS = {
    # Imágenes y multimedia
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.mp3', '.mp4',
    # Archivos comprimidos y documentos
    '.zip', '.tar', '.gz', '.rar', '.pdf',
    # Binarios y compilados
    '.exe', '.dll', '.so', '.pyc', '.class', '.keystore'
}

# Archivos específicos a ignorar
EXCLUDE_FILES = {OUTPUT_FILE, 'package-lock.json', 'yarn.lock'}

# 3. Función de seguridad: comprueba si el archivo es realmente de texto
def is_text_file(filepath):
    try:
        # Intenta leer los primeros 1024 bytes como texto UTF-8
        with open(filepath, 'r', encoding='utf-8') as f:
            f.read(1024)
        return True
    except UnicodeDecodeError:
        # Si da error de decodificación, es un archivo binario
        return False
    except Exception:
        return False

# Ejecución principal
with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk('.'):
        # Filtrar carpetas excluidas (modifica la lista in-place)
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file in EXCLUDE_FILES:
                continue
            
            # Comprobar la extensión del archivo
            _, ext = os.path.splitext(file)
            if ext.lower() in EXCLUDE_EXTENSIONS:
                continue
                
            file_path = os.path.join(root, file)
            
            # Comprobación final: si no es texto, lo saltamos
            if not is_text_file(file_path):
                print(f"Ignorado (binario detectado): {file_path}")
                continue

            # Escribir en el archivo de volcado
            outfile.write(f"\n{'='*50}\n")
            outfile.write(f"ARCHIVO: {file_path}\n")
            outfile.write(f"{'='*50}\n\n")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
            except Exception as e:
                outfile.write(f"[Error leyendo el archivo: {e}]\n")
            outfile.write("\n")

print(f"¡Listo! Archivos binarios ignorados correctamente. Todo se guardó en {OUTPUT_FILE}")
