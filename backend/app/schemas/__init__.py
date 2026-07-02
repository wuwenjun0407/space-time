import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---- 鉴权 ----
class CaptchaOut(BaseModel):
    captcha_key: str
    image: str  # base64 data url


class RegisterIn(BaseModel):
    username: str = Field(min_length=4, max_length=20)
    password: str = Field(min_length=8, max_length=32)
    nickname: Optional[str] = None
    captcha_key: str
    captcha_code: str


class LoginIn(BaseModel):
    username: str
    password: str
    captcha_key: Optional[str] = None
    captcha_code: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=32)


# ---- 用户 ----
class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateIn(BaseModel):
    nickname: Optional[str] = None


# ---- 群组 ----
class GroupOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_personal: bool
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class MemberOut(BaseModel):
    user_id: uuid.UUID
    username: str
    nickname: Optional[str] = None
    role: str
    joined_at: datetime


class AddMemberIn(BaseModel):
    username: str
    role: str = "member"


# ---- 分类 ----
class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    sort_order: int
    is_default: bool

    class Config:
        from_attributes = True


class CategoryIn(BaseModel):
    name: str = Field(max_length=50)
    sort_order: int = 0


# ---- 文件 / 上传 ----
class UploadFileIn(BaseModel):
    filename: str
    file_type: str
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None


class UploadTokenIn(BaseModel):
    group_ids: List[uuid.UUID]
    files: List[UploadFileIn]
    source: str = "admin"


class UploadTokenItem(BaseModel):
    group_id: uuid.UUID
    filename: str
    key: str
    upload_token: str


class FileOut(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID
    category_id: Optional[uuid.UUID]
    uploader_id: uuid.UUID
    file_type: str
    original_filename: Optional[str]
    storage_key: str
    url: Optional[str] = None
    description: Optional[str]
    shot_at: Optional[datetime]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class FileUpdateIn(BaseModel):
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None


# ---- 空间 ----
class SpaceIn(BaseModel):
    name: str = Field(max_length=100)
    description: Optional[str] = None
    visibility: str = "public_in_group"


class SpaceOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    cover_url: Optional[str]
    visibility: str
    is_default: bool
    creator_id: uuid.UUID
    file_count: int = 0

    class Config:
        from_attributes = True


class SpaceFileSortIn(BaseModel):
    file_ids: List[uuid.UUID]


# ---- 互动 ----
class CommentIn(BaseModel):
    content: str
    reply_to: Optional[uuid.UUID] = None


# ---- 皮肤 ----
class StyleOut(BaseModel):
    id: uuid.UUID
    key: str
    name: str
    sort_order: int
    is_active: bool

    class Config:
        from_attributes = True


class StyleIn(BaseModel):
    key: str
    name: str
    sort_order: int = 0


class ThemeOut(BaseModel):
    id: uuid.UUID
    style_id: uuid.UUID
    name: str
    bg_image_key: Optional[str]
    bg_video_key: Optional[str]
    effect_config: dict
    bgm_key: Optional[str]
    bgm_volume: float
    font_display: Optional[str]
    font_body: Optional[str]
    color_mode: str
    thumbnail_url: Optional[str]
    is_system: bool
    is_active: bool

    class Config:
        from_attributes = True


class ThemeIn(BaseModel):
    style_id: uuid.UUID
    name: str
    bg_image_key: Optional[str] = None
    bg_video_key: Optional[str] = None
    effect_config: dict = {}
    bgm_key: Optional[str] = None
    bgm_volume: float = 0.3
    font_display: Optional[str] = None
    font_body: Optional[str] = None
    color_mode: str = "dark"


class ApplyThemeIn(BaseModel):
    theme_id: uuid.UUID
    target_type: str = "home"
