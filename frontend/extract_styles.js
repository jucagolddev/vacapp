const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');
const luxeScssPath = path.join(__dirname, 'src', 'styles', 'core', '_luxe.scss');

let extractedStyles = '\n\n/* ==========================================\n   ESTILOS EXTRAÍDOS DE COMPONENTES (.ts)\n   ========================================== */\n';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const styleRegex = /,\s*styles:\s*\[\s*`([\s\S]*?)`\s*\]/g;
    
    let match;
    while ((match = styleRegex.exec(content)) !== null) {
        console.log(`Extracting styles from ${file}`);
        extractedStyles += `\n/* From ${path.basename(file)} */\n`;
        extractedStyles += match[1] + '\n';
        
        // Remove from content
        content = content.replace(match[0], '');
        fs.writeFileSync(file, content, 'utf8');
    }
});

// Append to target scss
fs.appendFileSync(luxeScssPath, extractedStyles, 'utf8');
console.log('Extraction complete.');
