"""Reading a document in a process of its own.

A parse runs someone else's bytes through a PDF library for as long as they
take. In a thread of the server that can't be stopped: a document built to be
slow would hold its slot until the container restarted, and one that crashes
the library would take the embedding model down with it. A child process can
be given a deadline and killed at it, and its memory goes with it.
"""

from __future__ import annotations

import multiprocessing
from multiprocessing.connection import Connection

from app.config import PARSE_TIMEOUT_SECONDS
from app.parse import Parsed, ParseError, parse


def _child(result: Connection, url: str, kind: str) -> None:
    try:
        result.send(("ok", parse(url, kind)))
    except ParseError as error:
        result.send(("refused", str(error)))
    except Exception as error:  # noqa: BLE001 - reported to the parent, which raises
        result.send(("failed", type(error).__name__))
    finally:
        result.close()


def parse_isolated(url: str, kind: str = "auto", timeout: float = PARSE_TIMEOUT_SECONDS) -> Parsed:
    """`parse`, in a child process that's stopped after `timeout` seconds.

    "spawn", not "fork": the server has onnxruntime's threads running, and a
    forked copy of a threaded process can deadlock on a lock some other thread
    held. A spawned child starts clean and imports only the parser.
    """
    context = multiprocessing.get_context("spawn")
    receive, send = context.Pipe(duplex=False)
    child = context.Process(target=_child, args=(send, url, kind), daemon=True)
    child.start()
    # The parent's copy of the sending end, or a dead child would never read as EOF.
    send.close()

    try:
        if not receive.poll(timeout):
            raise ParseError(f"Reading this document took longer than {timeout:.0f} seconds and was stopped.")
        try:
            outcome, payload = receive.recv()
        except EOFError as error:
            # The child died without answering: out of memory, or a crash in
            # the PDF library.
            raise ParseError("This document couldn't be read: the reader stopped unexpectedly.") from error
    finally:
        if child.is_alive():
            child.terminate()
            child.join(5)
            if child.is_alive():
                child.kill()
        child.join()
        receive.close()

    if outcome == "ok":
        return payload
    if outcome == "refused":
        raise ParseError(payload)
    raise ParseError(f"This document couldn't be read ({payload}).")
