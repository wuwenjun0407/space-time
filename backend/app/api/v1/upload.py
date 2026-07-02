import json

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import ForbiddenError
from app.models import Category, File, GroupMember, User
from app.schemas import UploadTokenIn, UploadTokenItem
from app.schemas.common import ok
from app.utils.qiniu_store import build_key, upload_token, verify_callback

router = APIRouter(tags=["upload"])


@router.post("/files/upload-token")
async def get_upload_token(body: UploadTokenIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tokens: list[UploadTokenItem] = []
    for gid in body.group_ids:
        member = await db.scalar(
            select(GroupMember).where(GroupMember.group_id ==
                                      gid, GroupMember.user_id == user.id)
        )
        if not member:
            raise ForbiddenError(f"非群组成员: {gid}")
        for f in body.files:
            ext = f.filename.rsplit(".", 1)[-1] if "." in f.filename else "bin"
            key = build_key(gid, f.category_id, ext)
            db.add(File(
                group_id=gid, category_id=f.category_id, uploader_id=user.id,
                file_type=f.file_type, original_filename=f.filename, storage_key=key,
                description=f.description, upload_source=body.source, status="pending_callback",
            ))
            tokens.append(UploadTokenItem(group_id=gid, filename=f.filename,
                          key=key, upload_token=upload_token(key, f.file_type)))
    return ok([t.model_dump(mode="json") for t in tokens])


@router.post("/qiniu/callback")
async def qiniu_callback(request: Request, authorization: str = Header(default=""), db: AsyncSession = Depends(get_db)):
    body = await request.body()
    if not verify_callback(authorization, body):
        return {"code": 40300, "message": "回调验证失败", "data": None}
    payload = json.loads(body)
    f = await db.scalar(select(File).where(File.storage_key == payload["key"]))
    if f:
        f.file_size = payload.get("fsize")
        f.mime_type = payload.get("mimeType")
        f.width = payload.get("w")
        f.height = payload.get("h")
        f.status = "ready"
    return ok(message="ok")
