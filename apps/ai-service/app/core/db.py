from contextlib import contextmanager
from typing import Iterator


def _import_psycopg():
    try:
        import psycopg
    except ImportError as exc:  # pragma: no cover - guarded by dependency setup
        raise RuntimeError("psycopg is required for PostgreSQL-backed AI logging") from exc

    return psycopg


@contextmanager
def connect(database_url: str) -> Iterator[object]:
    psycopg = _import_psycopg()
    connection = psycopg.connect(database_url)
    try:
        yield connection
    finally:
        connection.close()
