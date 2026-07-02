import asyncio
import asyncpg


async def main():
    c = await asyncpg.connect(host="39.96.23.52", port=5432, user="spacetime_user",
                              password="ZAQ!xsw2CDE#", database="spacetime_db")
    tables = await c.fetch("SELECT tablename FROM pg_tables WHERE schemaname='spacetime_db' ORDER BY 1")
    print("TABLES:", [t["tablename"] for t in tables])
    for t in ("styles", "themes", "users"):
        try:
            n = await c.fetchval(f"SELECT count(*) FROM spacetime_db.{t}")
            print(t, n)
        except Exception as e:
            print(t, "ERR", e)
    await c.close()


asyncio.run(main())
