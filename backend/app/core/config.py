from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # 应用
    PROJECT_NAME: str = "时空万象"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # 数据库
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_SCHEMA: str = "spacetime_db"

    # JWT
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # 七牛
    QINIU_ACCESS_KEY: str = ""
    QINIU_SECRET_KEY: str = ""
    QINIU_BUCKET: str = "family-media"
    QINIU_CALLBACK_URL: str = ""
    QINIU_DOMAIN: str = ""
    QINIU_TOKEN_EXPIRES: int = 3600

    # 验证码
    CAPTCHA_LENGTH: int = 4
    CAPTCHA_TTL_SECONDS: int = 120

    # 限流
    REGISTER_RATE_LIMIT: str = "3/minute"
    LOGIN_RATE_LIMIT: str = "10/minute"
    UPLOAD_RATE_LIMIT: str = "20/minute"

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # 初始化超管
    FIRST_SUPERADMIN_USERNAME: str = "superadmin"
    FIRST_SUPERADMIN_PASSWORD: str = "Admin12345"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
