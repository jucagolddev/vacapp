const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');
const luxeScssPath = path.join(__dirname, 'src', 'styles', 'core', '_luxe.scss');

// Texts to strip or replace
const replacements = [
  { search: /luxe-h1-premium/g, replace: 'page-h1-rustic' },
  { search: /luxe-p-premium/g, replace: 'page-p-rustic' },
  { search: /\bEdición Lujo\b/ig, replace: 'Versión Rústica' },
  { search: /\bLujo Elite\b/ig, replace: 'Rústico' },
  { search: /\bBuscador Premium\b/ig, replace: 'Buscador' },
  { search: /\bDiseño Premium\b/ig, replace: 'Diseño Base' },
  { search: /\bpremium-modal\b/ig, replace: 'rustic-modal' },
  { search: /\bluxe-search-wrapper\b/ig, replace: 'rustic-search-wrapper' },
  { search: /\bluxe-search-input-field\b/ig, replace: 'rustic-search-input-field' },
  { search: /\bsearch-icon-luxe\b/ig, replace: 'rustic-search-icon' },
];

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.search, r.replace);
  });
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}

function processDir(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) processDir(file);
    else if (file.endsWith('.ts') || file.endsWith('.html')) processFile(file);
  });
}

processDir(srcDir);
processFile(luxeScssPath);

console.log('Cleanup complete.');
