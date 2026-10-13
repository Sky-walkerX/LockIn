// Puts the CPU embedder's runtime where LockIn serves it from: public/ort/.
// Run by `pnpm dev` and `pnpm build`.
//
// Browsers without WebGPU embed notes with onnxruntime (lib/llm/wasm-embedder.ts).
// Its WebAssembly build is too big to go through the bundler, and the library
// that drives it would otherwise fetch it from a CDN while the page runs. It's
// copied out of node_modules instead, so the page loads no code from anywhere
// but LockIn. The files aren't in git (14 MB); the folder is named for the
// runtime's version, which is how the page asks for them and why they can be
// cached for good.
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The plain CPU build. The library's default (".asyncify") is twice the size
// for a WebGPU path LockIn doesn't use: its WebGPU embedder is web-llm.
const FILES = ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"];

// onnxruntime-web is the embedding library's dependency, not LockIn's, so it's
// found from there: the copy is always the version that library runs.
const fromHere = createRequire(import.meta.url);
const fromTransformers = createRequire(fromHere.resolve("@huggingface/transformers"));
const dist = dirname(fromTransformers.resolve("onnxruntime-web"));
const { version } = JSON.parse(readFileSync(join(dist, "..", "package.json"), "utf8"));

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "ort");
const target = join(root, version);

const upToDate = FILES.every((file) => {
  try {
    return statSync(join(target, file)).size === statSync(join(dist, file)).size;
  } catch {
    return false;
  }
});

if (!upToDate) {
  // Only one version is ever asked for; an older one is dead weight in the image.
  rmSync(root, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const file of FILES) copyFileSync(join(dist, file), join(target, file));
  console.log(`Copied the embedding runtime (onnxruntime-web ${version}) to public/ort/`);
}
