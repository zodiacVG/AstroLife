# Zeabur 平台部署指南

## 项目结构

本项目采用 monorepo 架构，包含前端、后端和共享数据：

```
AstroLife/
├── frontend/          # React 前端应用
├── backend/           # Python FastAPI 后端
├── shared/            # 前后端共享资源
│   ├── astro_data/    # 航天器数据 JSON 文件
│   ├── constants/     # 共享常量
│   └── types/         # TypeScript 类型定义
└── docs/              # 项目文档
```

## 部署步骤

### 1. 前端部署

**在 Zeabur 控制台：**
- 创建新项目
- 选择 GitHub 仓库
- 配置：
  - **根目录**: `frontend`
  - **构建命令**: `npm run build`
  - **启动命令**: `npm run preview` (或 `npm run start`)

**环境变量** (可选):
- `VITE_API_URL`: 后端 API 地址

### 2. 后端部署

**在 Zeabur 控制台：**
- 创建新项目
- 选择相同 GitHub 仓库
- 配置：
  - **根目录**: `backend`
  - **启动命令**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**环境变量**:
- `PORT`: 平台自动分配（请使用 `$PORT`）
- `ALIYUN_BAILIAN_API_KEY`: 如需启用 LLM 能力
- `ALIYUN_BAILIAN_MODEL`: 可选，默认 `qwen-plus`

### 3. 共享数据访问

共享数据由后端按项目根路径解析，无需额外配置部署路径。

## 部署后配置

### CORS 设置
在后端配置 CORS 允许前端域名：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.zeabur.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API 地址更新
前端通过环境变量 `VITE_API_URL` 指定后端地址，请在部署平台配置：
`VITE_API_URL=https://your-backend.zeabur.app`

## 常见问题

### Q: 共享数据如何同步更新？
A: 每次 Git 推送都会同时更新前后端，共享数据会保持一致。

### Q: 需要单独部署 shared 目录吗？
A: 不需要，shared 目录会随前后端一起部署。

### Q: 如何测试部署？
A: 
1. 本地测试：`npm run dev` (前端) 和 `python app.py` (后端)
2. 推送代码到 GitHub
3. Zeabur 会自动部署
4. 访问生成的域名测试

## 监控和日志

- 在 Zeabur 控制台查看部署日志
- 使用 Zeabur 提供的域名访问服务
- 配置自定义域名 (可选)
