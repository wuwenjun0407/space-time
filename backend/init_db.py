import asyncio

from app.core.database import Base, engine
import app.models  # noqa: F401


async def main():
    async with engine.begin() as conn:
        try:
            await conn.exec_driver_sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        except Exception as e:
            print("EXT ERR:", e)
        await conn.exec_driver_sql("CREATE SCHEMA IF NOT EXISTS spacetime_db")
        await conn.run_sync(Base.metadata.create_all)
    print("CREATED OK")
    await engine.dispose()


asyncio.run(main())
