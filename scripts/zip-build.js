import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createZip = () => {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0]; // Format: YYYYMMDD_HHMMSS
  
  const zipName = `rps_${timestamp}.zip`;
  const distPath = path.join(__dirname, '../dist');
  const outputPath = path.join(__dirname, '..', zipName);

  // Check if dist folder exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist folder not found. Run "npm run build" first.');
    process.exit(1);
  }

  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`\n✅ ZIP created: ${zipName} (${sizeInMB} MB)`);
    console.log(`📦 Ready to upload to Poki!`);
  });

  archive.on('error', (err) => {
    console.error('❌ Error creating ZIP:', err);
    throw err;
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('⚠️ Warning:', err);
    } else {
      throw err;
    }
  });

  console.log(`📦 Creating ${zipName}...`);
  
  archive.pipe(output);
  archive.directory(distPath, false); // false = don't include 'dist' folder name in zip
  archive.finalize();
};

createZip();
