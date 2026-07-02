from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_superadmin
from app.models import SystemSetting, User
from app.schemas.common import ok

router = APIRouter(prefix="/admin", tags=["admin-settings"])


@router.get("/settings")
async def get_settings(admin: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(SystemSetting))
    return ok({s.key: s.value for s in rows})


@router.patch("/settings")
async def update_settings(body: dict, admin: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    for k, v in body.items():
        row = await db.get(SystemSetting, k)
        if row:
            row.value = str(v)
        else:
            db.add(SystemSetting(key=k, value=str(v)))
    return ok(message="已保存")
