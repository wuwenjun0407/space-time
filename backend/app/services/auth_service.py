import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthError, ConflictError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models import (
    CaptchaCode,
    Category,
    Group,
    GroupMember,
    RefreshToken,
    Style,
    Theme,
    User,
    UserActiveTheme,
)

USERNAME_RE = re.compile(r"^[A-Za-z0-9_\u4e00-\u9fa5]{4,20}$")
PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,32}$")


async def verify_captcha(db: AsyncSession, key: str, code: str) -> None:
    row = await db.scalar(select(CaptchaCode).where(CaptchaCode.captcha_key == key))
    now = datetime.utcnow()
    if not row or row.used or row.expires_at < now or row.code.upper() != code.upper():
        raise AuthError("验证码错误或已失效")
    row.used = True


async def register(db: AsyncSession, username, password, nickname) -> User:
    if not USERNAME_RE.match(username):
        raise AuthError("用户名格式不符（4-20位，字母/数字/下划线/中文）")
    if not PASSWORD_RE.match(password):
        raise AuthError("密码须8-32位且含字母和数字")
    exists = await db.scalar(select(User).where(User.username == username))
    if exists:
        raise ConflictError("用户名已存在")

    user = User(username=username, nickname=nickname or username,
                password_hash=hash_password(password))
    db.add(user)
    await db.flush()

    group = Group(name=f"{user.nickname}的群组",
                  owner_id=user.id, is_personal=True)
    db.add(group)
    await db.flush()
    db.add(GroupMember(group_id=group.id,
           user_id=user.id, role="owner", is_active=True))
    db.add(Category(group_id=group.id, name="默认分类", is_default=True))

    theme = await db.scalar(
        select(Theme).join(Style).where(
            Style.key == "sci_tech", Theme.name == "银河漫游")
    )
    if theme:
        db.add(UserActiveTheme(user_id=user.id,
               target_type="home", theme_id=theme.id))
    await db.flush()
    return user


async def issue_tokens(db: AsyncSession, user: User) -> tuple[str, str]:
    access = create_access_token(str(user.id), user.role)
    raw, h = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=h,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    return access, raw


async def login(db: AsyncSession, username, password) -> User:
    user = await db.scalar(select(User).where(User.username == username))
    if not user or not verify_password(password, user.password_hash):
        if user:
            user.failed_login_count += 1
            user.last_failed_at = datetime.utcnow()
        raise AuthError("用户名或密码错误")
    if user.status == "banned":
        raise AuthError("账号已被封禁")
    user.failed_login_count = 0
    return user


async def rotate_refresh(db: AsyncSession, raw: str) -> User:
    h = hash_token(raw)
    row = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == h))
    if not row or row.expires_at < datetime.utcnow():
        raise AuthError("刷新令牌无效")
    user = await db.get(User, row.user_id)
    await db.delete(row)
    return user
