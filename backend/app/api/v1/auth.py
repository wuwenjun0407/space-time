from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.models import CaptchaCode, User
from app.schemas import (
    CaptchaOut,
    ChangePasswordIn,
    LoginIn,
    RefreshIn,
    RegisterIn,
    TokenOut,
)
from app.schemas.common import ok
from app.services import auth_service
from app.utils.captcha import generate_captcha

router = APIRouter(tags=["auth"])


@router.get("/auth/captcha")
async def captcha(db: AsyncSession = Depends(get_db)):
    key, code, image = generate_captcha()
    db.add(
        CaptchaCode(
            code=code,
            captcha_key=key,
            expires_at=datetime.utcnow() + timedelta(seconds=settings.CAPTCHA_TTL_SECONDS),
        )
    )
    return ok(CaptchaOut(captcha_key=key, image=image).model_dump())


@router.post("/auth/register")
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    await auth_service.verify_captcha(db, body.captcha_key, body.captcha_code)
    user = await auth_service.register(db, body.username, body.password, body.nickname)
    access, refresh = await auth_service.issue_tokens(db, user)
    return ok(TokenOut(access_token=access, refresh_token=refresh).model_dump())


@router.post("/auth/login")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    if body.captcha_key and body.captcha_code:
        await auth_service.verify_captcha(db, body.captcha_key, body.captcha_code)
    user = await auth_service.login(db, body.username, body.password)
    access, refresh = await auth_service.issue_tokens(db, user)
    return ok(TokenOut(access_token=access, refresh_token=refresh).model_dump())


@router.post("/auth/refresh")
async def refresh(body: RefreshIn, db: AsyncSession = Depends(get_db)):
    user = await auth_service.rotate_refresh(db, body.refresh_token)
    access, new_refresh = await auth_service.issue_tokens(db, user)
    return ok(TokenOut(access_token=access, refresh_token=new_refresh).model_dump())


@router.post("/auth/logout")
async def logout(user: User = Depends(get_current_user)):
    return ok(message="已登出")


@router.post("/auth/change-password")
async def change_password(
    body: ChangePasswordIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    if not verify_password(body.old_password, user.password_hash):
        return {"code": 40001, "message": "原密码错误", "data": None}
    user.password_hash = hash_password(body.new_password)
    return ok(message="密码已更新")
