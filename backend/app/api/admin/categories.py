from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_group_owner
from app.models import Category, GroupMember
from app.schemas import CategoryIn, CategoryOut
from app.schemas.common import ok

router = APIRouter(prefix="/admin/categories", tags=["admin-categories"])


@router.post("")
async def create(body: CategoryIn, owner: GroupMember = Depends(require_group_owner), db: AsyncSession = Depends(get_db)):
    c = Category(group_id=owner.group_id, name=body.name,
                 sort_order=body.sort_order)
    db.add(c)
    await db.flush()
    return ok(CategoryOut.model_validate(c).model_dump(mode="json"))


@router.patch("/{cid}")
async def edit(cid, body: CategoryIn, owner: GroupMember = Depends(require_group_owner), db: AsyncSession = Depends(get_db)):
    c = await db.get(Category, cid)
    c.name, c.sort_order = body.name, body.sort_order
    return ok(CategoryOut.model_validate(c).model_dump(mode="json"))


@router.delete("/{cid}")
async def delete(cid, owner: GroupMember = Depends(require_group_owner), db: AsyncSession = Depends(get_db)):
    c = await db.get(Category, cid)
    if c and not c.is_default:
        await db.delete(c)
    return ok(message="已删除")
