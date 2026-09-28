/**
 * Generates the vector-parity fixtures the Python service is tested against.
 *
 * This is ground truth on purpose: it runs the *same* library the browser CPU
 * path runs (`@huggingface/transformers`, already a dependency), loading the
 * same fp32 Snowflake weights with the same CLS pooling. Whatever this emits is
 * by definition "what LockIn's existing vectors look like", so a Python
 * implementation that matches it lands in the same vector space.
 *
 * Mirrors lib/llm/wasm-embedder.ts. If that file's POOLING, dtype, or
 * lib/llm/embed-input.ts's QUERY_PREFIX ever change, regenerate:
 *   node service/scripts/generate_fixtures.mjs
 */
import { writeFileSync } from "node:fs";
import { pipeline } from "@huggingface/transformers";

const ONNX_EMBEDDING_REPO = "Snowflake/snowflake-arctic-embed-s";
const EMBEDDING_MODEL = "snowflake-arctic-embed-s";
const EMBEDDING_DIMS = 384;
const QUERY_PREFIX = "Represent this sentence for searching relevant passages:";

const buildEmbedInput = (text, role) => (role === "query" ? `${QUERY_PREFIX} ${text}` : text);

// Deliberately awkward inputs, not just clean prose: the failure modes this
// test exists to catch (wrong pooling, missing prefix, a tokenizer that
// normalises differently) show up most clearly on markdown, unicode, very
// short strings, and text long enough to hit the 512-token truncation limit.
const CASES = [
  { text: "Gradient descent converges when the learning rate is small enough.", role: "passage" },
  { text: "## Chapter 3 — Eigenvalues\n\nA scalar **λ** is an eigenvalue of `A` if `det(A - λI) = 0`.", role: "passage" },
  { text: "x", role: "passage" },
  { text: "  leading and trailing whitespace  ", role: "passage" },
  { text: "Émile Durkheim — anomie, solidarité mécanique · 社会学 · 🧠", role: "passage" },
  { text: "- [ ] revise Krebs cycle\n- [x] finish problem set 4\n- [ ] office hours Thursday", role: "passage" },
  { text: "The mitochondrion is the powerhouse of the cell. ".repeat(80), role: "passage" },
  { text: "subject: Linear Algebra > milestone: Week 2 > task: Watch lecture 5\n\nSingular value decomposition factorises any matrix into U, Sigma, V transpose.", role: "passage" },
  { text: "what did I write about eigenvalues", role: "query" },
  { text: "krebs cycle", role: "query" },
  { text: "SVD", role: "query" },
  { text: "", role: "passage" },
];

const main = async () => {
  console.log(`Loading ${ONNX_EMBEDDING_REPO} (fp32)…`);
  const extractor = await pipeline("feature-extraction", ONNX_EMBEDDING_REPO, { dtype: "fp32" });

  const fixtures = [];
  for (const { text, role } of CASES) {
    const result = await extractor([buildEmbedInput(text, role)], { pooling: "cls", normalize: true });
    const vector = result.tolist()[0];
    if (vector.length !== EMBEDDING_DIMS) {
      throw new Error(`Expected ${EMBEDDING_DIMS} dims, got ${vector.length}`);
    }
    fixtures.push({ text, role, vector });
    console.log(`  ✓ [${role}] ${JSON.stringify(text.slice(0, 48))}${text.length > 48 ? "…" : ""}`);
  }

  const out = {
    model: EMBEDDING_MODEL,
    dims: EMBEDDING_DIMS,
    repo: ONNX_EMBEDDING_REPO,
    query_prefix: QUERY_PREFIX,
    pooling: "cls",
    normalize: true,
    generator: "@huggingface/transformers via service/scripts/generate_fixtures.mjs",
    fixtures,
  };
  const path = "service/tests/fixtures/parity.json";
  writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${fixtures.length} fixtures to ${path}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
