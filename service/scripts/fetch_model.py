"""Downloads the embedding weights into MODEL_DIR.

Run at image-build time, not at boot. A Cloud Run container that fetched ~130 MB
from Hugging Face on every cold start would turn a 5-second cold start into a
30-second one, and would make the service's availability depend on theirs.

    uv run python scripts/fetch_model.py [--dest DIR]
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from huggingface_hub import hf_hub_download

from app.config import MODEL_DIR, ONNX_EMBEDDING_REPO

# `onnx/model.onnx` is the fp32 build — the same file transformers.js pulls for
# `dtype: "fp32"`. The quantized siblings in that repo are a quarter the size and
# would put us in a different vector space; see lib/llm/wasm-embedder.ts:45.
FILES = {
    "onnx/model.onnx": "model.onnx",
    "tokenizer.json": "tokenizer.json",
    "tokenizer_config.json": "tokenizer_config.json",
    "special_tokens_map.json": "special_tokens_map.json",
    "config.json": "config.json",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dest", type=Path, default=MODEL_DIR)
    dest: Path = parser.parse_args().dest
    dest.mkdir(parents=True, exist_ok=True)

    for remote, local in FILES.items():
        target = dest / local
        if target.exists():
            print(f"  · {local} already present")
            continue
        print(f"  ↓ {ONNX_EMBEDDING_REPO}/{remote}")
        cached = hf_hub_download(repo_id=ONNX_EMBEDDING_REPO, filename=remote)
        # Copy rather than symlink: the HF cache is not in the final image layer.
        shutil.copyfile(cached, target)

    total = sum(f.stat().st_size for f in dest.iterdir() if f.is_file())
    print(f"\nModel ready in {dest} ({total / 1024 / 1024:.0f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
