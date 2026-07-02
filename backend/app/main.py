from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.admin import categories as admin_categories
from app.api.admin import files as admin_files
from app.api.admin import group_mgmt, logs, my_spaces, styles as admin_styles, users as admin_users
from app.api.admin import settings as settings_api
from app.api.v1 import (
    auth, categories, files, groups, interactions, messages, spaces, styles, system, upload, users,
)
from app.core.config import settings
from app.core.exceptions import AppException

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.http_status, content={"code": exc.code, "message": exc.message, "data": None})


@app.get("/health")
async def health():
    return {"code": 0, "message": "ok", "data": {"status": "up"}}

_P = settings.API_V1_PREFIX
for r in (auth, users, groups, categories, files, upload, spaces, interactions, styles, messages, system):
    app.include_router(r.router, prefix=_P)
for r in (my_spaces, group_mgmt, admin_files, admin_categories, admin_styles, admin_users, logs, settings_api):
    app.include_router(r.router, prefix=_P)
