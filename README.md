# 🚀 星航预言家 AstroLife

基于航天器神谕的智能占卜系统，通过「三体共鸣」理论为用户提供个性化指引。

## 📁 项目结构（当前）

```
AstroLife/                 # Monorepo 根目录
├── frontend/              # React + Vite 前端
├── backend/               # FastAPI 后端
├── shared/                # 前后端共享资源
│   ├── astro_data/        # 航天器数据
│   └── types/             # 共享类型定义
├── docs/                  # 项目文档
└── README.md
```

提示：旧文档 docs/monorepo-structure.md 描述了另一套 Next.js/Express 架构，已不再适配当前实现。请以本 README 与 docs 下的最新指南为准。

## ⚙️ 环境要求

- Node.js 18+（前端）
- npm 9+（或你偏好的包管理器）
- Python 3.10+（后端）

## 🚀 快速开始（本地开发）

1) 安装依赖
```bash
npm run install:all
```

2) 配置后端环境变量（可选但推荐）
- 复制 `backend/.env.example` 为 `backend/.env` 并完善
- 至少配置：`ALIYUN_BAILIAN_API_KEY`（如需启用 LLM 能力）

3) 启动开发环境
```bash
npm run dev
```

访问：
- 前端: http://localhost:5173
- 后端: http://localhost:8000
- API 文档: http://localhost:8000/docs

说明：前端通过环境变量 `VITE_API_URL` 访问后端（见 `frontend/.env.example` 与 `frontend/src/lib/api.ts`）。

## 🧰 常用命令

```bash
# 一键开发（前后端同时）
npm run dev

# 分别启动
npm run dev:frontend
npm run dev:backend

# 构建
npm run build           # 构建前端；后端无需编译
npm run build:frontend

# 生产运行（本地验证）
npm run start           # 并行运行：Vite preview + Uvicorn
npm run start:frontend  # Vite preview
npm run start:backend   # Uvicorn（无 reload）

# 清理构建产物
npm run clean
```

## 🧪 技术栈

- 前端：React 18、TypeScript、Vite、Tailwind、Zustand
- 后端：FastAPI、Uvicorn、python-dotenv
- AI 集成：阿里云百炼（OpenAI 兼容模式，可选）

数据说明：星舟数据支持动态扩展（不受固定数量限制），可由外部数据库或数据源持续新增。

## 📖 开发与配置文档

- 前端开发指南：`frontend/README.md`
- 后端开发与 API：`backend/README.md`
- 环境变量与启动流程：`docs/DEVELOPMENT.md`
- 部署指引（Zeabur 示例）：`docs/zeabur-deployment.md`

## 📌 已知事项

- `docs/monorepo-structure.md` 与当前实现不一致，仅作历史参考。
- 仓库中存在 `frontend/node_modules` 目录历史残留，已在 `.gitignore` 忽略，后续可清理。

## 🤝 贡献

1. 创建分支进行修改
2. 提交 PR 并说明变更
3. 通过代码审查后合并

## 📄 许可证

MIT
