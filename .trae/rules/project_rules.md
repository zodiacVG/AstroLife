# AstroLife 开发规范（Project Rules)

## API 规范

- 基础路径：使用版本前缀 `/api/v1`（保留历史无前缀端点以兼容）。
- 命名风格：资源名用复数小写，连接符使用中划线（kebab-case）。
- 端点清单不在本文件维护，避免漂移：
  - 后端实际端点：见 `backend/README.md`
  - 规划版接口：见 `docs/api-spec.md`
- 响应格式（包裹响应）：
  - 成功：`{ success: true, data: <payload>, message: 'OK', timestamp: ISO8601 }`
  - 失败：HTTP 状态码 + `{ success: false, error: { code, message }, timestamp }`
- 数据规模：不得在任何服务端或客户端中写死总量（例如 17）；一切数量由后端动态返回。

## 命名统一（三体）

- 中文：本命星舟（origin）、天时星舟（celestial）、问道星舟（inquiry）
- 函数与字段：统一使用 `origin`/`celestial`/`inquiry`
  - 后端函数：`calculate_origin_starship`、`calculate_celestial_starship`、`calculate_inquiry_starship`
  - 计算结果：`starships.origin|celestial|inquiry`，`match_scores.origin|celestial|inquiry`

## 问道星舟规则（LLM-only）

- 问道星舟仅允许 LLM 选择；严禁关键词匹配回退。
- LLM 不可用或失败时，应返回空结果并给出提示，由前端适配体验。

## 前端规范

- API 访问：统一使用 `frontend/src/lib/api.ts` 组装地址，优先读取 `VITE_API_URL`。
- 兼容处理：前端接收响应优先读取包裹响应的 `data` 字段，若不存在则回退到历史字段（如 `starships`）。
- 代码组织：业务页面在 `src/pages`；公共 API 常量推荐从 `shared/constants/astro.constants.ts` 引入（开发环境已允许越级导入）。
- 环境变量：在 `frontend/.env` 配置 `VITE_API_URL`；默认回退 `http://localhost:8000`。

## 后端规范

- 框架：FastAPI + Uvicorn。
- 版本路由：标准端点挂载在 `/api/v1/*`；视需要保留历史端点兼容一段时间，逐步废弃。
- CORS：使用环境变量 `CORS_ALLOW_ORIGINS` 配置，默认允许本机常用端口。
- 环境变量：
  - `ALIYUN_BAILIAN_API_KEY`、`ALIYUN_BAILIAN_MODEL`（可选）
  - `HOST`、`PORT`、`CORS_ALLOW_ORIGINS`
- 返回格式：v1 端点使用包裹响应格式（见 API 规范）。

## 数据与类型

- 共享类型与常量：放在 `shared/` 目录，前后端共享。
- 数据文件：`data/starships.json` 可扩展，禁止写死总量或 ID 范围。

## 开发流程

- 启动：`npm run dev`（并行启动前后端）。
- 构建与预览：`npm run build && npm run start`。
- 代码风格：遵循现有 ESLint/TypeScript 规则；Python 遵循 PEP8。
- Git：小步提交，信息清晰；特性分支合并前自测通过。

## 安全与配置

- 严禁将私密 Key 写入仓库；只通过 `.env` 或平台 Secret 管理。
- CORS 白名单最小化；生产环境仅允许业务域名。
- 日志勿输出敏感信息；错误信息面向用户时保持模糊。

## SOP：本地跑通项目

1) 依赖安装：根目录执行 `npm run install:all`
2) 后端环境变量：复制 `backend/.env.example` 为 `backend/.env`（如需 LLM，配置 `ALIYUN_BAILIAN_API_KEY`）
3) 前端环境变量（可选）：复制 `frontend/.env.example` 为 `frontend/.env`，设置 `VITE_API_URL`
4) 启动开发：`npm run dev`，前端 http://localhost:5173，后端 http://localhost:8000
5) API 验证：
   - `GET /api/v1`、`/api/v1/health`
   - `GET /api/v1/starships` 与 `GET /api/v1/starships/{archive_id}`
   - `POST /api/v1/divine/origin|celestial|inquiry|complete`

## SOP：新建一个 API 的流程

1) 规格：在 `docs/api-spec.md` 编写端点（方法/路径/入参/出参/错误码），明确是否返回包裹响应。
2) 模型：在后端创建 Pydantic 请求/响应模型，定义错误码映射。
3) 路由：在 `/api/v1/*` 下实现；如替换历史端点，保留兼容别名并计划废弃时间。
4) 常量：在 `shared/constants/astro.constants.ts` 新增端点常量。
5) 前端：通过 `frontend/src/lib/api.ts` 调用；优先解析 `data` 字段，必要时兼容历史字段。
6) 文档：更新 `backend/README.md` 和 `docs/api-spec.md`，在本文件记录开发规范或例外。
7) 验证：本地联调、添加最小测试用例；预发布验证后再上线。
