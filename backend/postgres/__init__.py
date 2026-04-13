import os
from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from config import POSTGRES_DB_NAME


_pool: ConnectionPool | None = None


def _build_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    database = os.getenv("POSTGRES_DB", POSTGRES_DB_NAME)
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"


def init_postgres() -> None:
    global _pool
    if _pool is not None:
        return

    _pool = ConnectionPool(
        conninfo=_build_database_url(),
        min_size=1,
        max_size=10,
        kwargs={"autocommit": True, "row_factory": dict_row},
        open=True,
    )

    with _pool.connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                email TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
                grade_level TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'user_profiles_grade_level_check'
                ) THEN
                    ALTER TABLE user_profiles
                    ADD CONSTRAINT user_profiles_grade_level_check
                    CHECK (grade_level IN ('k-5', '6-12', 'uni'));
                END IF;
            END $$;
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_lesson_completions (
                user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
                lesson_id TEXT NOT NULL,
                completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_email, lesson_id)
            )
            """
        )


def cleanup_postgres() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def get_postgres_pool() -> ConnectionPool:
    if _pool is None:
        raise RuntimeError("PostgreSQL pool is not initialized.")
    return _pool


PostgresPool = Annotated[ConnectionPool, Depends(get_postgres_pool)]


def get_postgres_connection(pool: PostgresPool) -> Iterator[Connection]:
    with pool.connection() as conn:
        yield conn


PostgresConnection = Annotated[Connection, Depends(get_postgres_connection)]

__all__ = [
    "PostgresConnection",
    "PostgresPool",
    "cleanup_postgres",
    "get_postgres_connection",
    "get_postgres_pool",
    "init_postgres",
]
