from fastapi import APIRouter, Depends
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Message, User
from app.schemas.common import ok

router = APIRouter(tags=["messages"])


@router.get("/messages")
async def list_messages(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = await db.scalars(select(Message).where(Message.user_id == user.id).order_by(Message.created_at.desc()).limit(100))
    unread = await db.scalar(select(func.count()).where(Message.user_id == user.id, Message.is_read.is_(False)))
    items = [
        {"id": str(m.id), "msg_type": m.msg_type, "title": m.title, "content": m.content,
         "is_read": m.is_read, "created_at": m.created_at.isoformat()} for m in rows
    ]
    return ok({"items": items, "unread": unread or 0})


@router.patch("/messages/{msg_id}/read")
async def read_one(msg_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    m = await db.get(Message, msg_id)
    if m and m.user_id == user.id:
        m.is_read = True
    return ok(message="已读")


@router.post("/messages/read-all")
async def read_all(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(update(Message).where(Message.user_id == user.id).values(is_read=True))
    return ok(message="全部已读")
