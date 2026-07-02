# 时空万象 · 后端（FastAPI 共享服务）

APP 与管理端共用此后端，API 前缀 `/api/v1`，管理端权限接口前缀 `/api/v1/admin`。

## 启动

```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head     # 建表 + seed 8风格16主题 + 超管
uvicorn app.main:app --reload --port 8000
```

默认超管：`superadmin / Admin12345`（见 `.env`）。

## 结构

- `app/core` 配置 / 数据库 / 安全 / 依赖
- `app/models` ORM 模型
- `app/schemas` Pydantic
- `app/services` 业务逻辑
- `app/api/v1` 通用接口（APP + 管理端共用）
- `app/api/admin` 管理端权限接口
- `alembic` 迁移 + 预置数据 seed
