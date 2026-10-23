const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = path.resolve(__dirname, '../biblioteca_regulatoria');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).sort();

console.log('Total PDFs encontrados:', files.length);

const results = [];
for (const f of files) {
  const full = path.join(dir, f);
  const data = fs.readFileSync(full);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  results.push({
    name: f,
    size: data.length,
    hash: hash
  });
  console.log(`${f} | ${data.length} bytes | sha256:${hash.slice(0, 16)}...`);
}

fs.writeFileSync(path.join(__dirname, 'pdf-manifest.json'), JSON.stringify(results, null, 2), 'utf-8');
console.log('Manifesto salvo em scripts/pdf-manifest.json');
