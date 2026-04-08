const fs = require('fs');
const path = require('path');

const luxePath = path.join(__dirname, 'src/styles/core/_luxe.scss');
const mainPath = path.join(__dirname, 'src/styles/main.scss');
const content = fs.readFileSync(luxePath, 'utf8');

const dirs = ['layout', 'components', 'features'].map(d => path.join(__dirname, 'src/styles', d));
dirs.forEach(d => { if(!fs.existsSync(d)) fs.mkdirSync(d, {recursive:true}); });

const regex = /\/\*\s*(?:\d+\.)?\s*(.*?)\s*\*\//g;
let match;
const sections = [];
let lastIndex = 0;
let lastTitle = 'imports';

while((match = regex.exec(content)) !== null) {
  if (match[0].includes('(') || match[0].includes('=')) continue;
  sections.push({ title: lastTitle, content: content.substring(lastIndex, match.index) });
  lastTitle = match[1].trim();
  lastIndex = match.index;
}
sections.push({ title: lastTitle, content: content.substring(lastIndex) });

let importsStr = `\n// Modulos Re-arquitecturizados\n`;

sections.forEach(sec => {
  let fileName = '';
  let targetDir = '';
  
  if (sec.title.includes('LAYOUT PRINCIPAL')) {
    fileName = '_sidebar.scss'; targetDir = dirs[0];
    sec.content += `
/* Fixes aplicados a Sidebar */
.nav-item-luxe .icon-frame {
  flex-shrink: 0;
  min-width: 36px;
}
.nav-item-luxe.selected lucide-icon, .nav-item-luxe.selected .icon-frame, .nav-item-luxe.selected .label-luxe {
  color: #ffffff !important;
}
.nav-item-luxe.selected {
  background: var(--ion-color-secondary) !important;
  color: #ffffff !important;
}
.rustic-sidebar.collapsed {
  --width: 90px !important;
  min-width: 90px !important;
}
`;
  } else if (sec.title.includes('CONTENEDORES')) {
    fileName = '_containers.scss'; targetDir = dirs[0];
  } else if (sec.title.includes('GANADO') || sec.title.includes('LOTES') || sec.title.includes('SANIDAD') || sec.title.includes('REPRODUCCI') || sec.title.includes('RECRÍA') || sec.title.includes('PANELES DETALLADOS')) {
    fileName = '_cards.scss'; targetDir = dirs[1];
  } else if (sec.title.includes('ELEMENTOS DE FORMULARIO') || sec.title.includes('Buscador')) {
    fileName = '_forms.scss'; targetDir = dirs[1];
  } else if (sec.title.includes('ANIMACIONES')) {
    fileName = '_animations.scss'; targetDir = dirs[1];
  } else if (sec.title.includes('UTILIDADES')) {
    fileName = '_utilities.scss'; targetDir = dirs[1];
  } else if (sec.title.includes('From ')) {
    fileName = '_component_overrides.scss'; targetDir = dirs[1];
  } else if (sec.title.includes('Fix outline removing for ionic items')) {
    // Merge into sidebar
    const fp = path.join(dirs[0], '_sidebar.scss');
    if (fs.existsSync(fp)) fs.appendFileSync(fp, sec.content);
    return;
  }
  
  if (fileName) {
    const fullPath = path.join(targetDir, fileName);
    let str = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') + '\n' + sec.content : sec.content;
    fs.writeFileSync(fullPath, str);
    
    let importPath = `@import './${path.basename(targetDir)}/${fileName.replace('.scss', '').replace('_', '')}';\n`;
    if (!importsStr.includes(importPath)) importsStr += importPath;
  }
});

let mainContent = fs.readFileSync(mainPath, 'utf8');
mainContent = mainContent.replace("@import './core/luxe';", importsStr);
fs.writeFileSync(mainPath, mainContent);

// Remove the old _luxe.scss
fs.unlinkSync(luxePath);
console.log("Refactoring complete");
