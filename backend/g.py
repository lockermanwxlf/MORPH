import os

from psycopg import connect


def build_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    database = os.getenv("POSTGRES_DB", "morph")
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"


def main() -> None:
    conninfo = build_database_url()
    with connect(conninfo=conninfo, autocommit=True) as conn:
        row = conn.execute("SELECT 1")
        value = row.fetchone()
        print(f"Postgres OK: {value[0]}")


if __name__ == "__main__":
    main()
