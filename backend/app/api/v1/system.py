from fastapi import APIRouter

from app.schemas.common import ok

router = APIRouter(tags=["system"])


@router.get("/system/version")
async def version():
    return ok({"version": "1.0.0", "min_supported": "1.0.0", "force_update": False})
