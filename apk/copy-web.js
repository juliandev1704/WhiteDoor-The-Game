// Copia el juego (HTML, CSS, JS, íconos) a www/ para empaquetarlo en la app.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest']) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ['css', 'js', 'icons', 'fonts']) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
console.log('Juego copiado a www/');
