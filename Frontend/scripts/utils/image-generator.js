const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('./build-config');

function generatePlaceholderImage(width, height, text, outputPath) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a1a"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .jpeg({ quality: config.imageConfig.quality })
    .toFile(outputPath);
}

function generateImages() {
  const imageDir = config.imageDir;
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const promises = [];

  config.contentTypes.forEach(type => {
    config.imageConfig.sizes.forEach(size => {
      for (let i = 1; i <= config.contentCount; i++) {
        const filename = `${type.toLowerCase()}-${i}-${size.name}.jpg`;
        const outputPath = path.join(imageDir, filename);
        const text = `${type} ${i} (${size.width}x${size.height})`;
        
        promises.push(
          generatePlaceholderImage(size.width, size.height, text, outputPath)
        );
      }
    });
  });

  return Promise.all(promises);
}

module.exports = generateImages; 