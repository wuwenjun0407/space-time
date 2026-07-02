"""seed 8 styles + 16 system themes + first superadmin

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-28
"""
import uuid

import bcrypt
from alembic import op

from app.core.config import settings

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

S = settings.DB_SCHEMA

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


def upgrade() -> None:
    bind = op.get_bind()
    style_ids = {}
    for i, (key, name) in enumerate(STYLES):
        sid = str(uuid.uuid4())
        style_ids[key] = sid
        bind.exec_driver_sql(
            f"INSERT INTO {S}.styles (id, key, name, sort_order, is_active) VALUES ('{sid}', '{key}', '{name}', {i}, true)"
        )
    for key, name, mode in THEMES:
        tid = str(uuid.uuid4())
        bind.exec_driver_sql(
            f"INSERT INTO {S}.themes (id, style_id, name, color_mode, is_system, is_active, font_display, font_body, effect_config, bgm_loop, bgm_volume) "
            f"VALUES ('{tid}', '{style_ids[key]}', '{name}', '{mode}', true, true, 'Inter', 'Source Han Sans SC', '{{}}', true, 0.3)"
        )
    h = bcrypt.hashpw(settings.FIRST_SUPERADMIN_PASSWORD.encode(),
                      bcrypt.gensalt(rounds=12)).decode()
    uid = str(uuid.uuid4())
    bind.exec_driver_sql(
        f"INSERT INTO {S}.users (id, username, nickname, password_hash, role, status, failed_login_count, avatar_audit_state) "
        f"VALUES ('{uid}', '{settings.FIRST_SUPERADMIN_USERNAME}', '超级管理员', '{h}', 'superadmin', 'active', 0, 'none')"
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.exec_driver_sql(f"DELETE FROM {S}.themes WHERE is_system = true")
    bind.exec_driver_sql(f"DELETE FROM {S}.styles")
    bind.exec_driver_sql(f"DELETE FROM {S}.users WHERE role = 'superadmin'")
