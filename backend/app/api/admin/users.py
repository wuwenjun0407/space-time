from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_superadmin
from app.core.security import hash_password
from app.models import User
from app.schemas import UserOut
from app.schemas.common import ok

router = APIRouter(prefix="/admin", tags=["admin-users"])


@router.get("/users/search")
async def search_users(q: str = Query(min_length=1), user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(
        select(User).where(or_(User.username.ilike(
            f"%{q}%"), User.nickname.ilike(f"%{q}%"))).limit(20)
    )
    return ok([{"id": str(u.id), "username": u.username, "nickname": u.nickname} for u in rows])


@router.get("/users")
async def list_users(admin: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(User).order_by(User.created_at.desc()).limit(200))
    return ok([UserOut.model_validate(u).model_dump(mode="json") for u in rows])


@router.patch("/users/{uid}/ban")
async def ban(uid, admin: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    u = await db.get(User, uid)
    u.status = "banned"
    return ok(message="已封禁")


@router.patch("/users/{uid}/unban")
async def unban(uid, admin: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    u = await db.get(User, uid)
    u.status = "active"
    return ok(message="已解封")


@router.post("/users/{uid}/reset-password")
async def reset_password(uid, new_password: str, admin: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    u = await db.get(User, uid)
    u.password_hash = hash_password(new_password)
    return ok(message="密码已重置")
