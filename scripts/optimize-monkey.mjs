import sharp from "sharp";

// Preserve all sixteen sprite cells; reduce excess source resolution for <=112px UI.
await sharp("public/characters/monkey-poses-v1.png")
  .resize(640, 640)
  .webp({ quality: 85, alphaQuality: 100 })
  .toFile("public/characters/monkey-poses-v1.webp");
