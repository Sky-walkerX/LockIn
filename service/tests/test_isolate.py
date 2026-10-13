"""A document is read in a child process that can be stopped."""

from __future__ import annotations

import socket
import threading
import time

import pytest

from app.isolate import parse_isolated
from app.parse import ParseError


def test_a_refusal_comes_back_as_the_same_refusal() -> None:
    with pytest.raises(ParseError, match="private address"):
        parse_isolated("http://10.0.0.5/internal", "auto", timeout=30)


def test_a_document_that_takes_too_long_is_stopped(monkeypatch: pytest.MonkeyPatch) -> None:
    """A server that accepts the connection and never answers stands in for a
    document that never finishes. The child is killed at the deadline; without
    it, this would sit for the fetch's own 30-second timeout."""
    listener = socket.socket()
    listener.bind(("127.0.0.1", 0))
    listener.listen(1)
    held: list[socket.socket] = []
    threading.Thread(target=lambda: held.append(listener.accept()[0]), daemon=True).start()
    port = listener.getsockname()[1]

    # The child is a fresh interpreter, so it's told through the environment
    # that this one private host may be fetched.
    monkeypatch.setenv("INGEST_ALLOWED_HOSTS", "localhost")

    started = time.monotonic()
    try:
        with pytest.raises(ParseError, match="took longer than 2 seconds"):
            parse_isolated(f"http://localhost:{port}/never.pdf", "pdf", timeout=2)
    finally:
        for connection in held:
            connection.close()
        listener.close()

    assert time.monotonic() - started < 15
