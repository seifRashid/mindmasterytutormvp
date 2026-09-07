import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// PNG generation utility using pure Node zlib
function createPng(width, height, drawFn) {
  const bytesPerPixel = 4; // RGBA
  const rowBytes = width * bytesPerPixel;
  const rawData = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData), 0);

    return Buffer.concat([len, typeAndData, crc]);
  }

  // Simple CRC32 implementation
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return ~c >>> 0;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // Bit depth: 8
  ihdr.writeUInt8(6, 9); // Color type: 6 (RGBA)
  ihdr.writeUInt8(0, 10); // Compression method: 0
  ihdr.writeUInt8(0, 11); // Filter method: 0
  ihdr.writeUInt8(0, 12); // Interlace method: 0

  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure directory exists
const iconsDir = path.join(process.cwd(), "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon design renderer
function renderBrandIcon(isMaskable) {
  return (x, y, w, h) => {
    // Normalized coordinates (-1 to 1)
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;
    const distSq = nx * nx + ny * ny;

    // Corner rounding for standard icons
    const cornerRadius = isMaskable ? 1.0 : 0.78;
    const cornerDist = Math.max(Math.abs(nx), Math.abs(ny));
    
    // Background gradient: Rich Royal Blue (#1d4ed8) to Indigo (#3730a3) to Cyan (#06b6d4)
    const t = (nx + ny + 2) / 4; // 0 to 1
    let bgR = Math.round(29 * (1 - t) + 14 * t);
    let bgG = Math.round(78 * (1 - t) + 116 * t);
    let bgB = Math.round(216 * (1 - t) + 235 * t);

    // Inner subtle glow
    if (distSq < 0.6) {
      const glow = (1 - distSq / 0.6) * 40;
      bgR = Math.min(255, bgR + glow * 0.3);
      bgG = Math.min(255, bgG + glow * 0.6);
      bgB = Math.min(255, bgB + glow);
    }

    if (!isMaskable && cornerDist > cornerRadius) {
      // Smooth anti-aliased border
      const borderDelta = (cornerDist - cornerRadius) / 0.15;
      if (borderDelta >= 1) return [0, 0, 0, 0];
      const alpha = Math.round((1 - borderDelta) * 255);
      return [bgR, bgG, bgB, alpha];
    }

    // Emblem scale
    const scale = isMaskable ? 0.55 : 0.68;
    const ex = nx / scale;
    const ey = ny / scale;

    // 1. Mortarboard (Graduation Cap Diamond)
    // Diamond equation: |ex| / a + |ey - cy| / b <= 1
    const capCy = -0.15;
    const capA = 0.72;
    const capB = 0.32;
    const inCap = Math.abs(ex) / capA + Math.abs(ey - capCy) / capB <= 1.0;

    // 2. Cap Base (Skull cap curve below the diamond)
    const inCapBase =
      ey >= -0.15 &&
      ey <= 0.22 &&
      Math.abs(ex) <= 0.42 &&
      ey >= -0.05 + 0.35 * (ex * ex);

    // 3. Open Book Wings below cap
    const bookCy = 0.42;
    const inLeftPage =
      ex >= -0.65 &&
      ex <= -0.05 &&
      ey >= 0.22 &&
      ey <= 0.62 &&
      ey >= 0.22 + 0.15 * Math.sin((ex + 0.05) * 3);

    const inRightPage =
      ex >= 0.05 &&
      ex <= 0.65 &&
      ey >= 0.22 &&
      ey <= 0.62 &&
      ey >= 0.22 + 0.15 * Math.sin((-ex + 0.05) * 3);

    // 4. Center Gold Star / Sparkle
    const inSparkle =
      Math.abs(ex) * Math.abs(ey - 0.42) <= 0.008 &&
      Math.abs(ex) <= 0.12 &&
      Math.abs(ey - 0.42) <= 0.12;

    if (inSparkle) {
      return [250, 204, 21, 255]; // Amber-400 Gold
    }

    if (inCap) {
      // Highlight on upper edge
      if (ey < capCy) {
        return [255, 255, 255, 255];
      }
      return [240, 246, 255, 255]; // Pure crisp white
    }

    if (inCapBase) {
      return [219, 234, 254, 255]; // Light blue accent
    }

    if (inLeftPage || inRightPage) {
      return [255, 255, 255, 245];
    }

    return [bgR, bgG, bgB, 255];
  };
}

// Generate PNG sizes
console.log("Generating 192x192 icon...");
const icon192 = createPng(192, 192, renderBrandIcon(false));
fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), icon192);

console.log("Generating 512x512 icon...");
const icon512 = createPng(512, 512, renderBrandIcon(false));
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), icon512);

console.log("Generating 512x512 maskable icon...");
const iconMaskable = createPng(512, 512, renderBrandIcon(true));
fs.writeFileSync(path.join(iconsDir, "icon-maskable-512x512.png"), iconMaskable);

console.log("Generating 180x180 apple touch icon...");
const iconApple = createPng(180, 180, renderBrandIcon(false));
fs.writeFileSync(path.join(iconsDir, "apple-touch-icon.png"), iconApple);

// Generate Vector SVG version
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e40af" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)"/>
  <g filter="url(#shadow)">
    <!-- Graduation Cap Top -->
    <polygon points="256,120 420,185 256,250 92,185" fill="#ffffff"/>
    <!-- Graduation Cap Skull -->
    <path d="M165,220 L165,275 C165,315 347,315 347,275 L347,220 Z" fill="#e0e7ff"/>
    <!-- Tassel -->
    <path d="M125,198 L120,300 C118,312 108,312 106,300 L115,194" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
    <!-- Open Book -->
    <path d="M130,340 Q193,310 256,335 Q319,310 382,340 L382,410 Q319,380 256,405 Q193,380 130,410 Z" fill="#ffffff"/>
    <!-- Center Divider & Star -->
    <line x1="256" y1="335" x2="256" y2="405" stroke="#93c5fd" stroke-width="4"/>
    <polygon points="256,355 261,368 274,370 264,379 267,392 256,385 245,392 248,379 238,370 251,368" fill="#facc15"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgIcon);
fs.writeFileSync(path.join(process.cwd(), "public", "favicon.svg"), svgIcon);

console.log("All PWA icons successfully generated!");
