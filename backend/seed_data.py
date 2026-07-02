"""生产标准初始化 + 模拟数据。幂等：已存在则跳过。"""
import asyncio
from datetime import datetime, timedelta, timezone

import bcrypt
from sqlalchemy import func, select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models import (
    Category, Comment, Favorite, File, Group, GroupMember, Like, Message,
    Space, SpaceFile, Style, Theme, User, UserActiveTheme,
)

STYLES = [
    ("sci_tech", "科技风 / 星空未来感"), ("rural", "乡村风"), ("pure_desire", "纯欲风"),
    ("retro_film", "复古胶片"), ("ink_wash", "国风水墨"), ("kids_fun", "童趣手绘"),
    ("minimal", "极简白"), ("dark_moody", "暗夜静谧"),
]
THEMES = [
    ("sci_tech", "银河漫游", "dark"), ("sci_tech", "赛博霓虹", "dark"),
    ("rural", "夏日麦浪", "light"), ("rural", "外婆的院子", "light"),
    ("pure_desire", "奶油草莓", "light"), ("pure_desire", "樱花季", "light"),
    ("retro_film", "7080", "dark"), ("retro_film", "黑白默片", "dark"),
    ("ink_wash", "青绿山水", "light"), ("ink_wash", "闲庭信步", "light"),
    ("kids_fun", "彩虹糖", "light"), ("kids_fun", "恐龙乐园", "light"),
    ("minimal", "留白", "light"), ("minimal", "纸张", "light"),
    ("dark_moody", "午夜电台", "dark"), ("dark_moody", "雨夜书房", "dark"),
]


def hpw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt(rounds=12)).decode()


async def seed_styles(db):
    if await db.scalar(select(func.count()).select_from(Style)):
        return await db.scalar(select(Theme).join(Style).where(Style.key == "sci_tech").limit(1))
    sid = {}
    for i, (key, name) in enumerate(STYLES):
        s = Style(key=key, name=name, sort_order=i)
        db.add(s)
        await db.flush()
        sid[key] = s.id
    first = None
    for key, name, mode in THEMES:
        t = Theme(style_id=sid[key], name=name, color_mode=mode, is_system=True,
                  font_display="Inter", font_body="Source Han Sans SC", effect_config={})
        db.add(t)
        await db.flush()
        first = first or t
    return first


async def get_or_create_user(db, username, nickname, pw, role="user"):
    u = await db.scalar(select(User).where(User.username == username))
    if u:
        return u
    u = User(username=username, nickname=nickname,
             password_hash=hpw(pw), role=role)
    db.add(u)
    await db.flush()
    return u


async def ensure_personal(db, user, theme):
    g = await db.scalar(select(Group).where(Group.owner_id == user.id, Group.is_personal.is_(True)))
    if g:
        return g
    g = Group(name=f"{user.nickname}的群组", owner_id=user.id, is_personal=True)
    db.add(g)
    await db.flush()
    db.add(GroupMember(group_id=g.id, user_id=user.id, role="owner", is_active=True))
    db.add(Category(group_id=g.id, name="默认分类", is_default=True))
    if theme:
        db.add(UserActiveTheme(user_id=user.id,
               target_type="home", theme_id=theme.id))
    await db.flush()
    return g


async def main():
    async with AsyncSessionLocal() as db:
        theme = await seed_styles(db)
        admin = await get_or_create_user(db, settings.FIRST_SUPERADMIN_USERNAME, "超级管理员",
                                         settings.FIRST_SUPERADMIN_PASSWORD, "superadmin")
        await ensure_personal(db, admin, theme)

        alice = await get_or_create_user(db, "alice", "Alice 王", "Pass12345")
        bob = await get_or_create_user(db, "bob", "Bob 李", "Pass12345")
        carol = await get_or_create_user(db, "carol", "Carol 张", "Pass12345")
        g_alice = await ensure_personal(db, alice, theme)
        await ensure_personal(db, bob, theme)
        await ensure_personal(db, carol, theme)

        for u in (bob, carol):
            if not await db.scalar(select(GroupMember).where(GroupMember.group_id == g_alice.id, GroupMember.user_id == u.id)):
                db.add(GroupMember(group_id=g_alice.id,
                       user_id=u.id, role="member"))
                db.add(Message(user_id=u.id, msg_type="group",
                       title="你被加入了「Alice 王的群组」", related_id=g_alice.id))

        cat = await db.scalar(select(Category).where(Category.group_id == g_alice.id, Category.is_default.is_(True)))
        if not await db.scalar(select(func.count()).select_from(File).where(File.group_id == g_alice.id)):
            uploaders = [alice, bob, carol]
            for i in range(30):
                ft = "image" if i % 5 else "video"
                shot = datetime.now() - timedelta(days=i * 3, hours=i)
                db.add(File(group_id=g_alice.id, category_id=cat.id, uploader_id=uploaders[i % 3].id,
                            file_type=ft, mime_type="image/jpeg" if ft == "image" else "video/mp4",
                            original_filename=f"memory_{i+1}.{'jpg' if ft == 'image' else 'mp4'}",
                            storage_key="presets/sci_tech/galaxy.jpg", file_size=1024000 + i * 1000,
                            width=1920, height=1080, description=f"成长记录 #{i+1}",
                            shot_at=shot, upload_source="admin", status="ready"))
            await db.flush()
        files = list(await db.scalars(select(File).where(File.group_id == g_alice.id)))
        if not await db.scalar(select(func.count()).select_from(Space).where(Space.group_id == g_alice.id)):
            s1 = Space(group_id=g_alice.id, creator_id=alice.id,
                       name="宝宝成长记", description="0-3岁影像", is_default=True)
            s2 = Space(group_id=g_alice.id, creator_id=alice.id,
                       name="家庭旅行", visibility="public_in_group")
            db.add(s1)
            db.add(s2)
            await db.flush()
            for i, f in enumerate(files[:12]):
                db.add(SpaceFile(space_id=s1.id, file_id=f.id,
                       sort_order=i, added_by=alice.id))
            for i, f in enumerate(files[12:20]):
                db.add(SpaceFile(space_id=s2.id, file_id=f.id,
                       sort_order=i, added_by=alice.id))
        for f in files[:10]:
            for u in (bob, carol):
                if not await db.scalar(select(Like).where(Like.file_id == f.id, Like.user_id == u.id)):
                    db.add(Like(file_id=f.id, user_id=u.id))
            db.add(Comment(file_id=f.id, user_id=bob.id, content="太有纪念意义了！"))
            db.add(Favorite(file_id=f.id, user_id=carol.id))
            db.add(Message(user_id=f.uploader_id, msg_type="interaction",
                   title="有人赞了你的影像", related_id=f.id))
        await db.commit()
    print("SEED DONE")


asyncio.run(main())
