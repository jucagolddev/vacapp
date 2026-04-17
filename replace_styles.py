import os
import re

FRONTEND_DIR = r"c:\xampp\htdocs\vacapp\frontend\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. CSS Class Prefix standardization
    # Replace luxe-, rustic-, vibrante- with vac-
    # Using word boundaries to avoid replacing parts of words if any, though prefix implies it's followed by word chars
    # However we just want to replace the prefix of classes like luxe-modal, rustic-card
    content = re.sub(r'\b(luxe|rustic|vibrante)-', 'vac-', content)

    # 2. Specific Lucide removals
    if filepath.endswith('finanzas.component.ts'):
        content = re.sub(r"import\s*\{\s*LucideAngularModule\s*\}\s*from\s*'lucide-angular';?\s*\n?", "", content)
        content = re.sub(r"LucideAngularModule\s*,\s*", "", content)
        content = re.sub(r",\s*LucideAngularModule", "", content)

    if filepath.endswith('app.config.ts'):
        # Remove import { LucideAngularModule, ... } from 'lucide-angular';
        content = re.sub(r"import\s*\{[^}]*LucideAngularModule[^}]*\}\s*from\s*'lucide-angular';?\s*\n?", "", content)
        
        # Remove importProvidersFrom(LucideAngularModule.pick({ ... }))
        content = re.sub(r"importProvidersFrom\s*\(\s*LucideAngularModule\.pick\s*\([^)]+\)\s*\)\s*,?\s*\n?", "", content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for root, dirs, files in os.walk(FRONTEND_DIR):
    for f in files:
        if f.endswith(('.ts', '.html', '.scss')):
            process_file(os.path.join(root, f))

print("Done.")
