# 开发与启动流程（统一说明）

本指南梳理当前项目的配置与本地启动方式，避免与历史文档混淆。

## 环境准备

- Node.js 18+
- npm 9+
- Python 3.10+

## 安装依赖

在仓库根目录执行：

```bash
npm run install:all
```

- 根目录安装 `concurrently`（用于并行启动前后端）
- 前端安装 `frontend` 依赖
- 后端安装 `backend` 依赖（如有需要建议在虚拟环境中）

## 环境变量

- 后端：复制 `backend/.env.example` 为 `backend/.env`，填写 `ALIYUN_BAILIAN_API_KEY` 以启用 LLM 功能
- 前端：通过 `VITE_API_URL` 配置后端地址（见 `frontend/.env.example`）

## 启动（开发）

根目录执行：

```bash
npm run dev
```

- 前端：Vite 启动在 `http://localhost:5173`
- 后端：Uvicorn 启动在 `http://localhost:8000`

## 构建与本地生产预览

```bash
npm run build        # 构建前端
npm run start        # 并行：Vite preview + Uvicorn（无 reload）
```

## 目录要点

- `frontend/`：React + Vite，页面代码位于 `src/pages`
- `backend/`：FastAPI，入口 `app/main.py`，Uvicorn 启动命令 `uvicorn app.main:app`
- `shared/`：共享航天器数据与类型
- `docs/`：项目文档（注意 `monorepo-structure.md` 为历史文档）

## 常见问题

- 看到 Docker 或 Turborepo 的说明？那些来自历史文档，与当前实现无关
- `frontend/node_modules` 目录历史残留：已在 `.gitignore` 忽略，后续可清理仓库中该目录
