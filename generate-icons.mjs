// 生成 PWA 图标和启动画面的脚本
import sharp from 'sharp';

const CORAL = '#F4845F';
const MINT = '#7EC8A4';
const CREAM = '#FFF8F0';

async function generateIcon(size, outputPath) {
  const svg = `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${CORAL}"/>
    <circle cx="${size * 0.5}" cy="${size * 0.38}" r="${size * 0.2}" fill="${CREAM}" opacity="0.9"/>
    <path d="M${size * 0.5} ${size * 0.25} C${size * 0.5} ${size * 0.25} ${size * 0.38} ${size * 0.34} ${size * 0.38} ${size * 0.42} C${size * 0.38} ${size * 0.48} ${size * 0.43} ${size * 0.54} ${size * 0.5} ${size * 0.54} C${size * 0.57} ${size * 0.54} ${size * 0.62} ${size * 0.48} ${size * 0.62} ${size * 0.42} C${size * 0.62} ${size * 0.34} ${size * 0.5} ${size * 0.25} ${size * 0.5} ${size * 0.25}Z" fill="${MINT}"/>
    <path d="M${size * 0.5} ${size * 0.31} C${size * 0.5} ${size * 0.31} ${size * 0.44} ${size * 0.37} ${size * 0.44} ${size * 0.42} C${size * 0.44} ${size * 0.46} ${size * 0.47} ${size * 0.49} ${size * 0.5} ${size * 0.49} C${size * 0.53} ${size * 0.49} ${size * 0.56} ${size * 0.46} ${size * 0.56} ${size * 0.42} C${size * 0.56} ${size * 0.37} ${size * 0.5} ${size * 0.31} ${size * 0.5} ${size * 0.31}Z" fill="${CREAM}"/>
    <text x="${size * 0.5}" y="${size * 0.78}" text-anchor="middle" font-family="sans-serif" font-size="${size * 0.12}" font-weight="700" fill="${CREAM}">孕婴守护</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`Generated: ${outputPath}`);
}

async function generateSplash(width, height, outputPath) {
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${CREAM}"/>
    <circle cx="${width * 0.5}" cy="${height * 0.35}" r="${Math.min(width, height) * 0.12}" fill="${CORAL}" opacity="0.15"/>
    <circle cx="${width * 0.5}" cy="${height * 0.35}" r="${Math.min(width, height) * 0.08}" fill="${CORAL}" opacity="0.3"/>
    <path d="M${width * 0.5} ${height * 0.28} C${width * 0.5} ${height * 0.28} ${width * 0.43} ${height * 0.32} ${width * 0.43} ${height * 0.37} C${width * 0.43} ${height * 0.41} ${width * 0.46} ${height * 0.44} ${width * 0.5} ${height * 0.44} C${width * 0.54} ${height * 0.44} ${width * 0.57} ${height * 0.41} ${width * 0.57} ${height * 0.37} C${width * 0.57} ${height * 0.32} ${width * 0.5} ${height * 0.28} ${width * 0.5} ${height * 0.28}Z" fill="${MINT}"/>
    <text x="${width * 0.5}" y="${height * 0.55}" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(width, height) * 0.06}" font-weight="700" fill="${CORAL}">孕婴健康守护</text>
    <text x="${width * 0.5}" y="${height * 0.6}" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(width, height) * 0.025}" fill="#999">健康数据追踪 · 宝宝发育监测 · 报告解析</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`Generated: ${outputPath}`);
}

async function main() {
  // PWA 图标
  await generateIcon(192, 'public/pwa-192x192.png');
  await generateIcon(512, 'public/pwa-512x512.png');

  // Apple Touch Icon
  await generateIcon(180, 'public/apple-touch-icon.png');

  // iOS 启动画面
  const splashSizes = [
    [2048, 2732, 'apple-splash-2048-2732'],  // 12.9" iPad Pro
    [1668, 2388, 'apple-splash-1668-2388'],  // 11" iPad Pro
    [1536, 2048, 'apple-splash-1536-2048'],  // 9.7" iPad
    [1125, 2436, 'apple-splash-1125-2436'],  // iPhone X/XS/11 Pro
    [1242, 2688, 'apple-splash-1242-2688'],  // iPhone XS Max/11 Pro Max
    [828, 1792, 'apple-splash-828-1792'],    // iPhone XR/11
    [750, 1334, 'apple-splash-750-1334'],    // iPhone 8/SE 2nd
  ];

  for (const [w, h, name] of splashSizes) {
    await generateSplash(w, h, `public/${name}.png`);
  }

  // Favicon
  await generateIcon(32, 'public/favicon-32x32.png');

  console.log('All icons generated!');
}

main().catch(console.error);
