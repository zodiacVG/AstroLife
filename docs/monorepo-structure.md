# 星航预言家项目 - Monorepo架构文档

## 项目概述

星航预言家是一个将航天历史与神秘占卜相结合的创新应用，采用Monorepo架构统一管理前后端代码、共享资源和文档。

### 核心特色
- **三体共鸣算法**：本命星舟、天时星舟、问道星舟的三重计算
- **17艘历史航天器**：每艘都有独特的神谕属性和象征意义
- **AI驱动的语义分析**：GPT-4智能选择问道星舟
- **沉浸式宇宙体验**：星空动画和神秘音效

## 目录结构

```
AstroLife/
├── apps/
│   ├── web/                    # 前端Next.js应用
│   │   ├── src/
│   │   │   ├── app/           # App Router (Next.js 14)
│   │   │   │   ├── page.tsx   # 主页
│   │   │   │   ├── api/       # 前端API路由
│   │   │   │   └── globals.css
│   │   │   ├── components/    # React组件
│   │   │   │   ├── ui/        # 基础UI组件
│   │   │   │   ├── sections/  # 页面区块
│   │   │   │   └── shared/    # 共享组件
│   │   │   ├── hooks/         # 自定义Hooks
│   │   │   ├── lib/           # 工具函数
│   │   │   └── types/         # TypeScript类型
│   │   ├── public/            # 静态资源
│   │   ├── package.json
│   │   └── next.config.js
│   └── server/                # 后端Express应用
│       ├── src/
│       │   ├── routes/        # API路由
│       │   ├── services/      # 业务逻辑
│       │   ├── middleware/    # 中间件
│       │   ├── utils/         # 工具函数
│       │   └── types/         # 类型定义
│       ├── package.json
│       └── server.js
├── shared/                    # 共享资源
│   ├── astro_data/
│   │   └── starships.json    # 17艘星舟完整数据
│   ├── types/                # 共享类型定义
│   └── constants/           # 共享常量
├── docs/                     # 项目文档
│   ├── api-spec.md          # API规范文档
│   ├── PRD.md               # 产品需求文档
│   └── monorepo-structure.md # 本文档
├── package.json             # 根package.json
├── turbo.json               # Turborepo配置
└── README.md
```

## 技术栈

### 前端技术栈
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.0+
- **样式**: Tailwind CSS + Framer Motion
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **图标**: Lucide React
- **动画**: Framer Motion
- **表单**: React Hook Form + Zod

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript 5.0+
- **AI服务**: OpenAI GPT-4 API
- **数据库**: MongoDB (历史记录)
- **缓存**: Redis (计算结果缓存)
- **验证**: Joi
- **日志**: Winston

### 开发工具
- **包管理**: pnpm workspaces
- **构建工具**: Turborepo
- **代码规范**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **环境管理**: dotenv

## 数据架构

### 核心数据文件: starships.json

优化后的数据结构，整合了基础信息和神谕属性：

```json
{
  "archive_id": "sputnik_1",
  "name_cn": "史普尼克1号",
  "name_official": "Sputnik 1",
  "launch_date": "1957-10-04",
  "mission_description": "人类首颗人造地球卫星，开启了太空时代",
  "mission_type": "地球轨道卫星",
  "country": "苏联",
  "oracle_keywords": ["勇气", "突破", "开创", "先驱", "人类第一步"],
  "oracle_text": "人类将首次挣脱地球引力的枷锁，这一小步，却是文明的一大步。你的命运中蕴含着开创新天地的勇气，不要害怕成为第一个吃螃蟹的人。"
}
```

### 数据结构优化
- **字段合并**: 将symbolic_meaning和spirit_core合并到oracle_keywords数组
- **命名统一**: 使用name_official替换name_en，确保官方命名一致性
- **简化结构**: 移除冗余嵌套，保持数据扁平化
- **语义清晰**: 每个字段都有明确的用途和含义

## API端点设计

### 核心API端点 (9个)

#### 1. 获取星舟列表
```
GET /api/v1/starships
响应: { starships: Starship[] }
```

#### 2. 计算本命星舟
```
POST /api/v1/divine/origin
请求: { birth_date: string }
响应: { starship: StarshipResult }
```

#### 3. 计算天时星舟
```
POST /api/v1/divine/celestial
请求: { inquiry_date: string }
响应: { starship: StarshipResult }
```

#### 4. 选择问道星舟
```
POST /api/v1/divine/inquiry
请求: { question: string }
响应: { starship: StarshipResult, reason: string }
```

#### 5. 完整三体共鸣
```
POST /api/v1/divine/complete
请求: { birth_date: string, inquiry_date: string, question: string, name?: string }
响应: { 
  starships: {
    origin: StarshipResult,
    celestial: StarshipResult,
    inquiry: StarshipResult
  },
  oracle_response: OracleResponse
}
```

#### 6. 获取历史记录
```
GET /api/v1/history?limit=10&offset=0
响应: { records: DivineRecord[], total: number }
```

#### 7. 获取单条记录
```
GET /api/v1/history/:id
响应: { record: DivineRecord }
```

#### 8. 删除历史记录
```
DELETE /api/v1/history/:id
响应: { success: boolean }
```

#### 9. 健康检查
```
GET /api/health
响应: { status: 'ok', timestamp: string }
```

### 数据模型

#### Starship (星舟基础信息)
```typescript
interface Starship {
  archive_id: string;           // 唯一标识符
  name_cn: string;              // 中文名称
  name_official: string;        // 官方英文名称
  launch_date: string;          // 发射日期 (YYYY-MM-DD)
  mission_description: string;  // 任务描述
  mission_type: string;         // 任务类型
  country: string;             // 发射国家
  oracle_keywords: string[];    // 神谕关键词
  oracle_text: string;         // 神谕解读文本
}
```

#### StarshipResult (计算结果)
```typescript
interface StarshipResult {
  starship: Starship;
  calculation: {
    type: 'origin' | 'celestial' | 'inquiry';
    basis: string;              // 计算依据描述
    date_diff?: number;         // 日期差值（天数）
    reason?: string;            // 选择理由（仅问道星舟）
  };
}
```

## 开发工作流

### 本地开发

#### 1. 环境准备
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

#### 2. 独立启动服务
```bash
# 仅启动前端
pnpm web:dev

# 仅启动后端
pnpm server:dev
```

#### 3. 代码质量检查
```bash
# 运行所有检查
pnpm lint

# 格式化代码
pnpm format

# 类型检查
pnpm type-check
```

### 环境配置

#### 根目录环境变量 (.env)
```bash
# 基础配置
NODE_ENV=development
PORT=3000

# 数据库
MONGODB_URI=mongodb://localhost:27017/astrolife
REDIS_URL=redis://localhost:6379

# AI服务
OPENAI_API_KEY=your_openai_key

# 其他服务
API_RATE_LIMIT=100
CACHE_TTL=600
```

#### 前端环境变量 (apps/web/.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=星航预言家
```

#### 后端环境变量 (apps/server/.env)
```bash
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## 部署架构

### 开发环境
- **前端**: http://localhost:3000 (Next.js dev server)
- **后端**: http://localhost:3001 (Express dev server)
- **数据库**: 本地MongoDB + Redis

### 生产环境
- **前端**: Vercel部署 (自动CI/CD)
- **后端**: Vercel Functions 或 Railway
- **数据库**: MongoDB Atlas + Redis Cloud
- **CDN**: Vercel Edge Network

### Docker支持
```dockerfile
# 多阶段构建示例
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 性能优化策略

### 前端优化
- **图片优化**: WebP格式，响应式图片
- **代码分割**: 按路由和组件分割
- **缓存策略**: SWR + Service Worker
- **预加载**: 关键资源预加载
- **压缩**: Gzip/Brotli压缩

### 后端优化
- **计算缓存**: Redis缓存重复计算结果
- **数据缓存**: 星舟数据24小时缓存
- **API缓存**: 合理的Cache-Control头
- **数据库索引**: 查询字段索引优化
- **连接池**: 数据库连接池管理

### CDN配置
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=600, stale-while-revalidate=86400"
        }
      ]
    }
  ]
}
```

## 监控与日志

### 前端监控
- **性能监控**: Vercel Analytics
- **错误追踪**: Sentry
- **用户行为**: Google Analytics 4

### 后端监控
- **应用监控**: PM2 + Winston日志
- **API监控**: 自定义中间件记录
- **健康检查**: /api/health端点
- **错误报警**: 钉钉/Slack Webhook

### 日志格式
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "astrolife-api",
  "method": "POST",
  "endpoint": "/api/v1/divine/complete",
  "duration": 2500,
  "user_agent": "Mozilla/5.0...",
  "ip": "xxx.xxx.xxx.xxx"
}
```

## 安全策略

### API安全
- **速率限制**: 基于IP的100次/小时限制
- **输入验证**: Joi schema验证
- **CORS配置**: 严格的白名单控制
- **HTTPS强制**: 生产环境强制HTTPS

### 数据安全
- **数据脱敏**: 用户敏感信息脱敏存储
- **访问日志**: 记录所有API访问
- **备份策略**: 每日自动备份到云端
- **GDPR合规**: 支持用户数据导出和删除

### 前端安全
- **XSS防护**: React自动转义 + CSP
- **CSRF防护**: 双重token验证
- **内容安全策略**: 严格的CSP头
- **依赖安全**: 定期npm audit

## 扩展计划

### 短期扩展 (1-2个月)
- **用户系统**: 注册/登录 + 个人历史
- **分享功能**: 社交媒体分享卡片
- **多语言**: 英文版本支持
- **PWA**: 渐进式Web应用

### 中期扩展 (3-6个月)
- **社区功能**: 用户分享和讨论
- **高级算法**: 更复杂的占卜算法
- **数据可视化**: 个人占卜统计图表
- **移动端**: React Native应用

### 长期愿景 (6-12个月)
- **AR体验**: 增强现实星图展示
- **语音交互**: 语音输入占卜
- **企业版**: B2B定制化占卜服务
- **国际化**: 多文化星舟体系

## 开发规范

### 代码规范
- **命名**: 小驼峰变量名，大驼峰类型名
- **文件**: 功能模块化，避免过大文件
- **注释**: JSDoc格式，关键逻辑必须注释
- **测试**: 关键功能单元测试覆盖率>80%

### Git工作流
- **分支策略**: Git Flow
- **提交规范**: Conventional Commits
- **代码审查**: 所有PR需要review
- **发布**: 自动化发布流程

### 性能基准
- **页面加载**: <3秒 (3G网络)
- **API响应**: <500ms (95%请求)
- **Lighthouse**: 性能分数>90
- **Bundle大小**: 首屏<200KB gzipped