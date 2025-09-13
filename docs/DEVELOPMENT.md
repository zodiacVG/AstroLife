# 开发与启动流程（统一说明）

本指南梳理当前项目的配置与本地启动方式，避免与历史文档混淆。

## 环境准备

- Node.js 18+
- npm 9+
- Python 3.11（推荐；Python 3.13 可能需要本地 Rust 编译 pydantic-core）

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
  
## 安装与运行（含 pyenv 用法）

推荐使用 Python 3.11/3.12。若已用 pyenv 安装 3.11.9，可按如下方式安装后端依赖：

```bash
# 一键安装（前后端依赖）并指定 Python 解释器
PYTHON_BIN=$HOME/.pyenv/versions/3.11.9/bin/python3.11 npm run install:all

# 或仅安装后端依赖
PYTHON_BIN=$HOME/.pyenv/versions/3.11.9/bin/python3.11 npm run install:backend
```

启动开发：

```bash
npm run dev
# 前端: http://localhost:5173
# 后端: http://localhost:8000
```
  （推荐使用 `python3.11 -m venv backend/venv && source backend/venv/bin/activate` 后再安装依赖）

## 启动（开发）

根目录执行：

```bash
npm run dev
```

- 前端：Vite 启动在 `http://localhost:5173`
- 后端：Uvicorn 启动在 `http://localhost:8000`（使用 `backend/venv` 的 Python）

如果看到 BACKEND 未输出启动日志，通常是 `backend/venv` 未创建或 Python 版本不匹配：

```bash
# 用 pyenv 3.11.9 重建后端依赖与 venv
PYTHON_BIN=$HOME/.pyenv/versions/3.11.9/bin/python3.11 npm run install:backend

# 单独启动后端（不经 npm）
cd backend && ./venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

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

## UI 修复与约定（2025-09）

为解决“控制栏按钮点击后偶发消失/联动消失”的问题，并优化占卜流程体验，本次前端做了如下变更与约定：

- 控制栏稳定性
  - 去除模糊滤镜以避免部分浏览器对 `position: sticky` 的层合成异常。
  - 采用 `position: sticky`，并通过 `transform: translateZ(0)` 稳定图层。
  - 变更位置：
    - frontend/src/styles/ao-design.css:151

- 按钮视觉状态（避免 currentColor 竞态）
  - 不再使用 `currentColor` 同时驱动背景与文字色；统一采用显式的主题变量色。
  - 仅保留点击瞬时反馈（`:active`），去除 hover 与持久 pressed（`aria-pressed`）高亮，避免残留态。
  - 变更位置：
    - frontend/src/styles/ao-design.css:85
    - frontend/src/styles/ao-design.css:96
    - frontend/src/styles/ao-design.css:100

- 开始按钮的“处理中”状态（与流式输出同步）
  - 之前：三步并发计算结束后立即结束“处理中”，导致神谕流式期间按钮恢复为“开始占卜”。
  - 现在：仅当无法进入流式阶段时才结束；进入流式后在 `onDone`/`onError` 里结束。
  - 变更位置：
    - frontend/src/pages/CalculatePage.tsx:320
    - frontend/src/pages/CalculatePage.tsx:329
    - frontend/src/pages/CalculatePage.tsx:505
    - frontend/src/pages/CalculatePage.tsx:531

- 三舟卡片信息增强
  - 增加三舟解释：
    - ORIGIN（本命之舟）：内在禀赋与稳定气质。
    - CELESTIAL（天时之舟）：当下时势与节律。
    - INQUIRY（问道之舟）：与问题共振的行动线索。
  - 展示匹配度与关键词（最多 3 个），保留“查看详情”。
  - 变更位置：
    - frontend/src/pages/CalculatePage.tsx:555

### 后续编辑指引

- 如需恢复 hover/pressed 效果，请避免 `currentColor` 同时作为 `background` 与 `color` 的来源；推荐显式使用 `var(--ao-color-system)` 或 `var(--ao-color-oracle)`。
- 若再次出现粘性栏闪烁/隐藏，可尝试：
  - 移除所在父层的 `overflow: hidden`/`filter`/`backdrop-filter`。
  - 为栏添加 `isolation: isolate;` 或 `will-change: transform;`，按最小必要原则逐项启用。
