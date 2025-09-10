# Zeabur + GitHub 部署全指南

本指南覆盖将本仓库（前端 + 后端 + 共享数据）通过 GitHub 一键部署到 Zeabur 的完整流程，并给出环境变量、CORS、健康检查与常见问题排查策略。

---

## 架构与目录

- `frontend/`：Vite + React 前端，打包产物 `dist/`。
- `backend/`：FastAPI 后端，SSE 输出在 `/api/v1/oracle/stream`。
- `shared/`：前后端共享的航天器数据与常量，后端以相对路径读取。

```
AstroLife/
├─ frontend/
├─ backend/
├─ shared/
└─ docs/
```

---

## 前置准备

- GitHub 仓库已创建并推送代码（public 或 private 均可）。
- Zeabur 账户已开通，并授权访问 GitHub。
- 若需启用 LLM：准备好阿里云百炼 API Key。

---

## 在 Zeabur 创建项目并绑定 GitHub

1) 登录 Zeabur 控制台 → 新建 Project。
2) 选择 “Import from GitHub”，挑选本仓库。
3) 本仓为 monorepo，需要在同一 Project 中创建两个 Service：`frontend` 与 `backend`。

---

## 部署后端（FastAPI）

- Service 类型：`Python`（自动检测）。
- Root Directory：`backend`
- Build Command：`pip install -r requirements.txt`
- Start Command：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path：`/health`

环境变量（Settings → Environment）：

- `PORT`: 平台自动注入（请在启动命令中使用 `$PORT`）。
- `ALIYUN_BAILIAN_API_KEY`: 可选，启用 LLM 则必填。
- `ALIYUN_BAILIAN_MODEL`: 可选，默认 `qwen-plus`。
- `ALIYUN_BAILIAN_FAST_MODEL`: 可选，默认 `qwen-flash`（问题航天器匹配低成本模型）。
- `CORS_ALLOW_ORIGINS`: 填前端域名（部署后再回填），示例：`https://your-frontend.zeabur.app`。也可用多个域逗号分隔。
- `CORS_ALLOW_ORIGIN_REGEX`: 可选，使用正则放行一批来源。

注意：后端会读取 `../data/starships.json`。Zeabur 克隆的是整个仓库，Root Directory 仅指构建与启动目录，因此共享数据可被正确访问，无需额外拷贝。

---

## 部署前端（Vite + React）

- Service 类型：`Static` 或 `Node` 均可。
  - 若使用 `Static`：
    - Root Directory：`frontend`
    - Build Command：`npm ci && npm run build`
    - Publish Directory：`dist`
    - Start/Run：由平台静态托管，无需 `preview`。
  - 若使用 `Node`（更接近本地 `vite preview` 行为）：
    - Root Directory：`frontend`
    - Build Command：`npm ci && npm run build`
    - Start Command：`npm run preview -- --host --port $PORT`

环境变量（Settings → Environment）：

- `VITE_API_URL`：后端域名，例：`https://your-backend.zeabur.app`

可选（指定版本以避免差异）：

- `NODE_VERSION=18` 或更高版本。

---

## 绑定域名与联调

1) 等待两项 Service 均 `Healthy`。点击各自 Service → Domains → 记录系统域名。
2) 回到前端 Service → Settings → Environment，设置 `VITE_API_URL` 为后端域名 → Redeploy。
3) 回到后端 Service → Settings → Environment，设置 `CORS_ALLOW_ORIGINS` 包含前端域名 → Redeploy。

验证接口：

- 后端健康检查：`GET https://<backend-domain>/health` 或 `GET /api/v1/health`
- SSE 流式：前端页面触发占卜，浏览器网络面板可见 `/api/v1/oracle/stream` 长连接。

---

## CI/CD 策略

- 在 Project → Settings 中选择自动部署分支（如 `main`）。
- 每次合并到该分支，前后端 Service 将自动重建与发布。
- 如需手动发布，可在各 Service 中点 `Redeploy`。

---

## 常见问题与排查

1) 403/CORS 错误：
- 确保后端 `CORS_ALLOW_ORIGINS` 包含前端完整域名（含 `https://`）。
- 未显式配置时，后端默认仅放行本机/私网；线上必须显式设置。

2) SSE 无输出或被中断：
- 确认前端使用 `EventSource` 连接 `/api/v1/oracle/stream`；后端已设置 `X-Accel-Buffering: no` 头部，避免缓冲。
- 浏览器/网络代理可能会中断空闲连接；重试并观察后端日志。

3) 500 报错（LLM 相关）：
- 检查 `ALIYUN_BAILIAN_API_KEY` 是否配置；
- 若成本敏感，确保 `ALIYUN_BAILIAN_FAST_MODEL=qwen-flash` 用于问题航天器匹配；
- 查看后端日志中 `[LLM select_question_starship]` 和 `SSE` 的 Prompt 打印。

4) 共享数据找不到：
- 确认 Service 的 Root Directory 设置为 `backend`；Zeabur 会克隆完整仓库，运行时 `../data/starships.json` 应存在。
- 若仍异常，可在后端日志打印 `os.getcwd()` 与目录结构定位。

5) 前端无法连到后端：
- 前端的 `VITE_API_URL` 是否为后端线上域名，且已重新部署前端；
- 后端 `CORS_ALLOW_ORIGINS` 是否已包含该前端域名。

---

## 本地对照测试

- 前端：`cd frontend && npm ci && npm run dev`
- 后端：`cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`
- 前端 `.env`：`VITE_API_URL=http://localhost:8000`

---

## 环境变量速查

- 后端：
  - `ALIYUN_BAILIAN_API_KEY`
  - `ALIYUN_BAILIAN_MODEL`（默认 `qwen-plus`）
  - `ALIYUN_BAILIAN_FAST_MODEL`（默认 `qwen-flash`）
  - `CORS_ALLOW_ORIGINS` / `CORS_ALLOW_ORIGIN_REGEX`
  - `PORT`（平台注入）
- 前端：
  - `VITE_API_URL`

---

## 成功验证清单

- 前端打开后，可输入生日并得到三舟结果；
- 自动折叠三舟后，能看到“神谕 / Oracle”流式输出；
- 浏览器 Network 面板看到 `/api/v1/oracle/stream` 处于 `pending` 并陆续收到增量文本；
- 后端 `/health` 返回 `healthy`；
- 若配置了 LLM，能生成富含“太空风格”的解读且不出现鼓励式收尾。
