"""SQLAlchemy 2.0 ORM models — 时空万象 数据模型（schema: spacetime_db）。"""
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _pk()
    username: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(50))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    avatar_audit_state: Mapped[str] = mapped_column(String(20), default="none")
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), default="user", nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False)
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0)
    last_failed_at: Mapped[datetime | None] = mapped_column()
    delete_requested_at: Mapped[datetime | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now())


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[uuid.UUID] = _pk()
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False)
    is_personal: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now())


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id"),)

    id: Mapped[uuid.UUID] = _pk()
    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), default="member", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("group_id", "name"),)

    id: Mapped[uuid.UUID] = _pk()
    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class File(Base):
    __tablename__ = "files"

    id: Mapped[uuid.UUID] = _pk()
    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("groups.id"), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"))
    uploader_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(50))
    original_filename: Mapped[str | None] = mapped_column(String(255))
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int | None] = mapped_column(BigInteger)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text)
    shot_at: Mapped[datetime | None] = mapped_column()
    upload_source: Mapped[str] = mapped_column(String(10), default="app")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now())


class Space(Base):
    __tablename__ = "spaces"

    id: Mapped[uuid.UUID] = _pk()
    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    creator_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cover_url: Mapped[str | None] = mapped_column(Text)
    visibility: Mapped[str] = mapped_column(
        String(20), default="public_in_group")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now())


class SpaceMember(Base):
    __tablename__ = "space_members"
    __table_args__ = (UniqueConstraint("space_id", "user_id"),)

    id: Mapped[uuid.UUID] = _pk()
    space_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(server_default=func.now())


class SpaceFile(Base):
    __tablename__ = "space_files"

    space_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(
        "spaces.id", ondelete="CASCADE"), primary_key=True)
    file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(
        "files.id", ondelete="CASCADE"), primary_key=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    added_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    added_at: Mapped[datetime] = mapped_column(server_default=func.now())


class SpaceTheme(Base):
    __tablename__ = "space_themes"

    id: Mapped[uuid.UUID] = _pk()
    space_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(
        "spaces.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("themes.id", ondelete="SET NULL"))
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now())


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("file_id", "user_id"),)

    id: Mapped[uuid.UUID] = _pk()
    file_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("file_id", "user_id"),)

    id: Mapped[uuid.UUID] = _pk()
    file_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = _pk()
    file_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    reply_to: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("comments.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Style(Base):
    __tablename__ = "styles"

    id: Mapped[uuid.UUID] = _pk()
    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Theme(Base):
    __tablename__ = "themes"

    id: Mapped[uuid.UUID] = _pk()
    style_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("styles.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    bg_image_key: Mapped[str | None] = mapped_column(String(500))
    bg_video_key: Mapped[str | None] = mapped_column(String(500))
    effect_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    bgm_key: Mapped[str | None] = mapped_column(String(500))
    bgm_loop: Mapped[bool] = mapped_column(Boolean, default=True)
    bgm_volume: Mapped[float] = mapped_column(Float, default=0.3)
    font_display: Mapped[str | None] = mapped_column(String(100))
    font_body: Mapped[str | None] = mapped_column(String(100))
    color_mode: Mapped[str] = mapped_column(String(10), default="dark")
    thumbnail_url: Mapped[str | None] = mapped_column(Text)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    creator_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class UserActiveTheme(Base):
    __tablename__ = "user_active_theme"
    __table_args__ = (UniqueConstraint("user_id", "target_type"),)

    id: Mapped[uuid.UUID] = _pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type: Mapped[str] = mapped_column(String(20), nullable=False)
    theme_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("themes.id", ondelete="SET NULL"))
    applied_at: Mapped[datetime] = mapped_column(server_default=func.now())


class UserAsset(Base):
    __tablename__ = "user_assets"

    id: Mapped[uuid.UUID] = _pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str | None] = mapped_column(String(100))
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    audit_state: Mapped[str] = mapped_column(String(20), default="pending")
    reject_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = _pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(
        String(200), unique=True, nullable=False)
    device_info: Mapped[str | None] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class CaptchaCode(Base):
    __tablename__ = "captcha_codes"

    id: Mapped[uuid.UUID] = _pk()
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    captcha_key: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = _pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    msg_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200))
    content: Mapped[str | None] = mapped_column(Text)
    related_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id: Mapped[uuid.UUID] = _pk()
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String(50))
    resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    detail: Mapped[dict | None] = mapped_column(JSONB)
    ip: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now())
