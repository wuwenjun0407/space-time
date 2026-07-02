from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_superadmin
from app.models import OperationLog, User
from app.schemas.common import ok

router = APIRouter(prefix="/admin", tags=["admin-logs"])


@router.get("/logs")
async def logs(admin: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(OperationLog).order_by(OperationLog.created_at.desc()).limit(200))
    return ok([
        {"id": str(l.id), "action": l.action, "resource_type": l.resource_type,
         "ip": l.ip, "created_at": l.created_at.isoformat()} for l in rows
    ])
