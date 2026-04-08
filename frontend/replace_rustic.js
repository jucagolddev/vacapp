const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      processDir(fullPath);
    }
    else if (file.endsWith('.ts') || file.endsWith('.html') || file.endsWith('.scss')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      content = content.replace(/premium/g, 'rustic');
      content = content.replace(/Premium/g, 'Rustic');
      content = content.replace(/PREMIUM/g, 'RUSTIC');
      content = content.replace(/var\(--rustic-gradient\)/g, 'var(--ion-color-primary)');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

processDir(path.join(__dirname, 'src'));
console.log("Rustic replacement complete.");
