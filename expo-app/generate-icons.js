const sharp = require('sharp');

const source = 'assets/LOGOANDICON.png';
const outputs = [
  { path: 'assets/icon.png', size: 1024 },
  { path: 'assets/splash-icon.png', size: 2048 },
  { path: 'assets/android-icon-foreground.png', size: 1024 },
  { path: 'assets/favicon.png', size: 512 }
];

async function main() {
  for (const { path, size } of outputs) {
    await sharp(source)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre'
      })
      .png()
      .toFile(path);
    console.log(`Generated ${path} ${size}x${size}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
