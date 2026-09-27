// Generates the PNG app icons from scripts/icon.svg. Run: node scripts/generate-icons.mjs
import sharp from "sharp";

const sizes = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/maskable-512.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 180 },
  { file: "src/app/icon.png", size: 64 },
];

for (const { file, size } of sizes) {
  await sharp("scripts/icon.svg").resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
