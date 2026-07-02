from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User
from app.schemas import UserOut, UserUpdateIn
from app.schemas.common import ok

router = APIRouter(tags=["users"])


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return ok(UserOut.model_validate(user).model_dump(mode="json"))


@router.patch("/me")
async def update_me(body: UserUpdateIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if body.nickname is not None:
        user.nickname = body.nickname
    return ok(UserOut.model_validate(user).model_dump(mode="json"))
