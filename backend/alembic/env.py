import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from app.core.config import settings
from app.core.database import Base
import app.models  # noqa: F401  (注册所有模型)

config = context.config
config.set_main_option(
    "sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def do_run_migrations(connection: Connection):
    connection.exec_driver_sql(
        f"CREATE SCHEMA IF NOT EXISTS {settings.DB_SCHEMA}")
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table_schema=settings.DB_SCHEMA,
        include_schemas=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


run_migrations_online()
