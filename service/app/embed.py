"""The embedder.

This module has one job and it is an exacting one: produce vectors that land in
the *same space* as the ones LockIn's browsers already wrote. A mistake here
does not raise — a wrongly-pooled vector is still 384 floats, still normalised,
still passes every dimension check in the TypeScript — it just retrieves
badly, forever, for reasons nobody can see. `tests/test_embed.py` is the only
thing standing between that bug and production.

The reference implementation is lib/llm/wasm-embedder.ts:
  - the fp32 ONNX build of Snowflake/snowflake-arctic-embed-s (not quantized:
    a quantized build's vectors drift, and both are 384-dim so nothing catches it)
  - CLS pooling, not mean (wasm-embedder.ts:77-79)
  - L2 normalisation at write time, so scoring downstream is a plain dot product
  - the query prefix from lib/llm/embed-input.ts on queries only
"""

from __future__ import annotations

import json
import threading
from typing import Literal

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

from app.config import (
    EMBEDDING_DIMS,
    MAX_SEQUENCE_LENGTH,
    MODEL_DIR,
    QUERY_PREFIX,
)

Role = Literal["query", "passage"]


def build_embed_input(text: str, role: Role) -> str:
    """Port of `buildEmbedInput` in lib/llm/embed-input.ts, kept byte-identical."""
    return f"{QUERY_PREFIX} {text}" if role == "query" else text


class Embedder:
    """Wraps one ONNX session and one tokenizer.

    Loading is lazy and guarded: Cloud Run can dispatch several requests into a
    cold container at once, and two threads racing to build an InferenceSession
    would double the memory of the slowest part of startup.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._session: ort.InferenceSession | None = None
        self._tokenizer: Tokenizer | None = None
        self._input_names: set[str] = set()
        self._pad_id = 0
        self._max_length = MAX_SEQUENCE_LENGTH

    def load(self) -> None:
        if self._session is not None:
            return
        with self._lock:
            if self._session is not None:
                return

            tokenizer = Tokenizer.from_file(str(MODEL_DIR / "tokenizer.json"))

            # The tokenizer's own configured limit wins where it exists; 512 is
            # BERT's ceiling and the fallback. transformers.js applies the same
            # truncation, so matching it is part of parity.
            max_length = MAX_SEQUENCE_LENGTH
            config_path = MODEL_DIR / "tokenizer_config.json"
            if config_path.exists():
                configured = json.loads(config_path.read_text()).get("model_max_length")
                if isinstance(configured, int) and 0 < configured <= MAX_SEQUENCE_LENGTH:
                    max_length = configured

            # Truncation and padding are done by hand in `embed`, not by the
            # tokenizer. See the note there — the tokenizer's own truncation
            # produces different vectors than the browser's.
            tokenizer.no_truncation()
            tokenizer.no_padding()

            pad_id = tokenizer.token_to_id("[PAD]")
            if pad_id is None:
                raise RuntimeError("Tokenizer has no [PAD] token; cannot batch safely.")

            self._pad_id = pad_id
            self._max_length = max_length

            options = ort.SessionOptions()
            options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            session = ort.InferenceSession(
                str(MODEL_DIR / "model.onnx"),
                sess_options=options,
                providers=["CPUExecutionProvider"],
            )

            self._input_names = {i.name for i in session.get_inputs()}
            self._tokenizer = tokenizer
            self._session = session

    @property
    def is_loaded(self) -> bool:
        return self._session is not None

    def embed(self, texts: list[str], role: Role) -> list[list[float]]:
        """Embed a batch, returning L2-normalised 384-dim vectors in input order."""
        if not texts:
            return []

        self.load()
        assert self._tokenizer is not None and self._session is not None

        encodings = self._tokenizer.encode_batch(
            [build_embed_input(text, role) for text in texts]
        )

        # Truncation, deliberately done the "wrong" way.
        #
        # transformers.js slices the token sequence *after* the special tokens
        # are added, so an over-length input loses its trailing [SEP] and ends
        # mid-sentence. HF `tokenizers`' own truncation instead keeps
        # [CLS] + 510 body + [SEP], which is the textbook-correct thing to do
        # and produces a measurably different vector (cosine 0.997 against the
        # browser's, versus 1.000 for the slice).
        #
        # LockIn's database is already full of vectors embedded the first way.
        # Parity with that corpus is the requirement; BERT orthodoxy is not.
        # Do not "fix" this without regenerating every stored embedding.
        sequences = [e.ids[: self._max_length] for e in encodings]
        width = max(len(s) for s in sequences)

        # Padded by hand as well, since padding to the batch's longest sequence
        # *before* slicing would allocate the full width of the longest input.
        input_ids = np.full((len(sequences), width), self._pad_id, dtype=np.int64)
        attention_mask = np.zeros((len(sequences), width), dtype=np.int64)
        for row, sequence in enumerate(sequences):
            input_ids[row, : len(sequence)] = sequence
            attention_mask[row, : len(sequence)] = 1

        # Padding is harmless for CLS pooling *provided* the mask is passed:
        # position 0 attends only to real tokens, so a short text batched with a
        # long one gets the same vector it would get alone. The test suite
        # asserts exactly that rather than trusting it.
        feeds: dict[str, np.ndarray] = {}
        if "input_ids" in self._input_names:
            feeds["input_ids"] = input_ids
        if "attention_mask" in self._input_names:
            feeds["attention_mask"] = attention_mask
        if "token_type_ids" in self._input_names:
            feeds["token_type_ids"] = np.zeros_like(input_ids)

        last_hidden_state = self._session.run(None, feeds)[0]

        # CLS pooling: token 0. Mean pooling here would produce plausible,
        # plausibly-scaled, entirely wrong vectors.
        pooled = np.asarray(last_hidden_state)[:, 0, :].astype(np.float32)

        norms = np.linalg.norm(pooled, axis=1, keepdims=True)
        # A zero vector would divide to NaN and poison every dot product it
        # touches. It shouldn't happen, but silently emitting NaN is the kind of
        # failure this whole module is written to avoid.
        norms = np.where(norms == 0, 1.0, norms)
        normalised = pooled / norms

        if normalised.shape[1] != EMBEDDING_DIMS:
            raise RuntimeError(
                f"Model produced {normalised.shape[1]} dimensions, expected {EMBEDDING_DIMS}."
            )

        return normalised.tolist()


embedder = Embedder()
