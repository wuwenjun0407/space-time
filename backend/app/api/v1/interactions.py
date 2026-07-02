from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Comment, Favorite, Like, Message, User
from app.schemas import CommentIn
from app.schemas.common import ok

router = APIRouter(tags=["interactions"])


async def _notify_uploader(db, file_id, msg_type, title):
    from app.models import File
    f = await db.get(File, file_id)
    if f:
        db.add(Message(user_id=f.uploader_id, msg_type=msg_type,
               title=title, related_id=file_id))


@router.post("/files/{file_id}/like")
async def like(file_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    exists = await db.scalar(select(Like).where(Like.file_id == file_id, Like.user_id == user.id))
    if not exists:
        db.add(Like(file_id=file_id, user_id=user.id))
        await _notify_uploader(db, file_id, "interaction", "有人赞了你的影像")
    return ok(message="已点赞")


@router.delete("/files/{file_id}/like")
async def unlike(file_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.scalar(select(Like).where(Like.file_id == file_id, Like.user_id == user.id))
    if row:
        await db.delete(row)
    return ok(message="已取消")


@router.post("/files/{file_id}/favorite")
async def favorite(file_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    exists = await db.scalar(select(Favorite).where(Favorite.file_id == file_id, Favorite.user_id == user.id))
    if not exists:
        db.add(Favorite(file_id=file_id, user_id=user.id))
    return ok(message="已收藏")


@router.delete("/files/{file_id}/favorite")
async def unfavorite(file_id, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    row = await db.scalar(select(Favorite).where(Favorite.file_id == file_id, Favorite.user_id == user.id))
    if row:
        await db.delete(row)
    return ok(message="已取消收藏")


@router.post("/files/{file_id}/comments")
async def comment(file_id, body: CommentIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db.add(Comment(file_id=file_id, user_id=user.id,
           content=body.content, reply_to=body.reply_to))
    await _notify_uploader(db, file_id, "interaction", "有人评论了你的影像")
    return ok(message="评论成功")
