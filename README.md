# 🚀 星航预言家 AstroLife

基于航天器神谕的智能占卜系统，通过"三体共鸣"理论为用户提供深度个性化的人生指导。

## 📁 项目结构

```
AstroLife/                 # Monorepo根目录
├── frontend/              # React前端应用
├── backend/               # FastAPI后端服务
├── shared/                # 共享资源
│   ├── astro_data/        # 航天器数据
│   └── types/             # 共享类型定义
├── docs/                  # 项目文档
└── docker-compose.yml     # 容器化部署
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm run install:all
```

### 2. 启动开发环境
```bash
npm run dev
```

访问：
- 前端: http://localhost:5173
- 后端: http://localhost:8000
- API文档: http://localhost:8000/docs

### 3. 技术栈

**前端**
- React 18 + TypeScript
- Vite构建工具
- TailwindCSS样式
- Zustand状态管理

**后端**
- FastAPI框架
- OpenAI集成
- SQLite数据库
- Docker容器化

## 📊 数据架构

- **航天器数据**: 17个历史航天器完整档案
- **神谕数据**: 每个航天器的象征意义和解读
- **三体共鸣**: 本命/问道/天时星舟智能匹配

## 🎯 核心功能

1. **智能占卜**: 基于出生日期、问题、时间的三体匹配
2. **诗意解读**: AI生成的四段式深度神谕
3. **可视化**: 星舟卡片和航线图表
4. **历史追溯**: 完整的占卜记录

## 📖 开发文档

- [产品需求文档](./docs/PRD.md)
- [技术架构](./docs/monorepo-structure.md)
- [API文档](./backend/README.md)
- [前端指南](./frontend/README.md)

## 🔧 开发命令

```bash
# 一键启动
npm run dev

# 单独启动
npm run dev:frontend    # 前端开发
npm run dev:backend     # 后端开发

# 构建部署
npm run build
npm run docker:up
```

## 🐳 Docker部署

```bash
docker-compose up -d
```

## 📈 项目状态

- ✅ 数据架构设计完成
- ✅ 三体共鸣算法实现
- ✅ Monorepo结构搭建
- 🔄 前端界面开发中
- 🔄 后端API开发中

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交PR
4. 通过代码审查

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件