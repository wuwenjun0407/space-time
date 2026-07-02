# 时空万象 · 家庭私人影像空间（Monorepo）

> 一人一宇宙，一域一时光，珍藏全家所有岁月影像

面向个人 / 家庭 / 小型亲友团的私密影像存储、记录、互动与沉浸式展示产品。本仓库采用 **monorepo** 架构，包含三个产品：

| 目录       | 产品                         | 技术栈                                           | 状态   |
| ---------- | ---------------------------- | ------------------------------------------------ | ------ |
| `backend/` | 共享后端 API（APP + 管理端） | FastAPI + SQLAlchemy2 async + PostgreSQL         | 开发中 |
| `admin/`   | Web 后台管理端               | Next.js 14 + Ant Design 5 + TanStack Query       | 开发中 |
| `app/`     | 移动端 APP                   | Flutter 3 + Riverpod（占位，待管理端验证后开发） | 待启动 |

## 架构决策

- **单一共享后端**：APP 与管理端复用同一 FastAPI 服务，API 前缀 `/api/v1`，管理端权限路由前缀 `/api/v1/admin`，保证数据隔离与上传逻辑一致。
- **群组即内容池**：文件归属群组；空间通过 `space_files` 引用策展。
- **统一响应体**：`{ code, message, data }`。

## 快速开始

### 后端

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env                            # 填写配置
alembic upgrade head                              # 建表 + 预置皮肤 seed
uvicorn app.main:app --reload --port 8000
```

### 管理端

```bash
cd admin
npm install
copy .env.example .env.local
npm run dev   # http://localhost:3000
```

## 目录结构

```
spacetime/
├── backend/   # FastAPI 共享后端
├── admin/     # Next.js 14 管理端
├── app/       # Flutter APP（占位）
└── docs/      # 产品 / 技术文档
```
