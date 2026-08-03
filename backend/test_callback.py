import asyncio
from app.api.integrations import oauth_callback
from app.core.database import SessionLocal

async def test():
    async with SessionLocal() as db:
        try:
            await oauth_callback("google", "dummy_code", "848b43a8-22e6-408e-a133-9bbeaca71a08", db)
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test())
