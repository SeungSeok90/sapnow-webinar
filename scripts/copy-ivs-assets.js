const { copyFileSync, mkdirSync, existsSync } = require("fs");
const { join } = require("path");

const src = join(__dirname, "../node_modules/amazon-ivs-player/dist/assets");
const dest = join(__dirname, "../public/ivs");

if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

const files = [
  "amazon-ivs-wasmworker.min.js",
  "amazon-ivs-wasmworker.min.wasm",
  "amazon-ivs-worker.min.js",
];

for (const file of files) {
  copyFileSync(join(src, file), join(dest, file));
}

console.log("IVS assets copied to public/ivs/");
