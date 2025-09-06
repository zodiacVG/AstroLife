# 星航预言家 - Monorepo 架构方案

## 项目结构建议

```
AstroLife/
├── README.md                 # 项目总览
├── package.json             # 根目录脚本管理
├── .git/                    # 单一git仓库
├── frontend/                # 前端项目
│   ├── package.json
│   ├── src/
│   ├── public/
│   └── ...
├── backend/                 # 后端项目
│   ├── package.json
│   ├── src/
│   ├── requirements.txt
│   └── ...
├── shared/                  # 共享资源
│   ├── types/              # 共享类型定义
│   ├── constants/          # 共享常量
│   └── utils/              # 共享工具函数
└── docs/                   # 项目文档
```

## 技术方案对比

### 方案一：Monorepo (推荐 ✅)
**优势：**
- ✅ 单一git仓库，避免混乱
- ✅ 一个IDE窗口，AI编辑无缝切换
- ✅ 共享代码和类型定义
- ✅ 统一构建和部署流程
- ✅ 更好的代码复用

**目录结构：**
```
AstroLife/
├── frontend/           # React/Vue 前端
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/            # Python/FastAPI 后端
│   ├── app/
│   ├── requirements.txt
│   └── main.py
├── shared/            # 共享数据
│   ├── astro_data/
│   │   ├── astro_facts_data.json
│   │   └── astro_oracle_data.json
│   └── types/
└── docker-compose.yml
```

### 方案二：Git Submodules
**适合：** 如果前后端团队完全独立
**缺点：** 复杂度高，AI编辑体验差

### 方案三：工作区管理
**VS Code Workspace:**
```json
{
  "folders": [
    {
      "name": "AstroLife-Root",
      "path": "."
    },
    {
      "name": "Frontend",
      "path": "./frontend"
    },
    {
      "name": "Backend",
      "path": "./backend"
    }
  ],
  "settings": {
    "files.exclude": {
      "frontend/": true,
      "backend/": true
    }
  }
}
```

## 实施步骤

### 1. 创建Monorepo结构
```bash
# 当前目录已经是AstroLife，直接重构
mkdir -p frontend backend shared/{types,constants,utils}
mv astro_*_data.json shared/astro_data/
mv *.md docs/
```

### 2. 前端技术栈建议
- **框架：** React + TypeScript
- **构建：** Vite
- **样式：** TailwindCSS
- **状态：** Zustand
- **路由：** React Router

### 3. 后端技术栈建议
- **框架：** FastAPI (Python)
- **数据库：** SQLite (轻量级) 或 PostgreSQL
- **AI集成：** OpenAI API
- **部署：** Docker

### 4. 开发脚本配置
根目录 `package.json`:
```json
{
  "name": "astrolife-monorepo",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && python -m uvicorn main:app --reload",
    "build": "npm run build:frontend && npm run build:backend",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && pip install -r requirements.txt"
  }
}
```

## 开发工作流

### 日常开发
1. **启动：** `npm run dev` (一键启动前后端)
2. **切换：** IDE中直接跳转不同文件夹
3. **AI编辑：** 无需切换项目，AI理解整个代码库

### 代码共享
```typescript
// shared/types/astrolife.ts
export interface StarshipData {
  archive_id: string;
  name_cn: string;
  name_en: string;
  launch_date: string;
  // ...
}

// 前端和后端都可以引用
import { StarshipData } from '@shared/types';
```

### 构建部署
- **开发：** 本地 `npm run dev`
- **生产：** Docker Compose 一键部署
- **CI/CD：** GitHub Actions 统一管理

## 推荐的最终结构

让我立即为你创建这个结构：